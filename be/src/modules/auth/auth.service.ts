import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ActorType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthContext, isTeam } from '../../common/auth/auth-context';
import {
  createQrTokenFingerprint,
  normalizeQrToken,
} from '../../common/qr/qr-token';
import { PrismaService } from '../prisma/prisma.service';
import { TeamLoginDto, UserLoginDto } from './dto/login.dto';
import { QrLoginDto } from './dto/qr-login.dto';
import { TeamQrLoginDto } from './dto/team-qr-login.dto';

type TeamForSession = {
  id: number;
  name: string;
  username: string;
  captainName: string;
  totalPoints: number;
  maxPossiblePoints: number;
  totalPlaySeconds: number;
  startedAt: Date | null;
  status: string;
  color: string | null;
};

type PrismaSessionClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuthService {
  private readonly qrLoginAttempts = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async loginUser(dto: UserLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      type: 'USER',
      role: user.role,
    });

    await this.prisma.activityLog.create({
      data: {
        actorType: ActorType.USER,
        actorId: String(user.id),
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: String(user.id),
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async loginTeam(dto: TeamLoginDto) {
    const team = await this.prisma.team.findFirst({
      where: { username: dto.username, status: 'ACTIVE' },
    });
    if (!team || !(await bcrypt.compare(dto.password, team.passwordHash))) {
      throw new UnauthorizedException('Invalid team credentials');
    }

    return this.issueTeamSession(team, dto.deviceLabel, 'TEAM_LOGIN');
  }

  async loginTeamWithQr(dto: TeamQrLoginDto) {
    const qrToken = normalizeQrToken(dto.qrToken);
    const team = await this.prisma.team.findFirst({
      where: {
        loginQrFingerprint: createQrTokenFingerprint(qrToken),
        status: 'ACTIVE',
      },
    });

    if (!team?.loginQrHash || !(await bcrypt.compare(qrToken, team.loginQrHash))) {
      throw new UnauthorizedException('Invalid team QR token');
    }

    return this.issueTeamSession(team, dto.deviceLabel, 'TEAM_QR_LOGIN');
  }

  async loginWithQr(dto: QrLoginDto) {
    const qrToken = normalizeQrToken(dto.token);
    const tokenHash = createQrTokenFingerprint(qrToken);
    this.assertQrLoginRateLimit(tokenHash);

    const now = new Date();
    const existing = await this.prisma.qrLoginToken.findUnique({
      where: { tokenHash },
      include: { team: true },
    });
    const preflightError = this.getQrLoginRejectCode(existing, now);
    if (preflightError) {
      await this.logQrLoginRejected(preflightError, existing);
      this.throwQrLoginError(preflightError);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.qrLoginToken.updateMany({
        where: {
          id: existing!.id,
          isActive: true,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          lastUsedAt: now,
          usageCount: { increment: 1 },
        },
      });

      if (updated.count !== 1) {
        const current = await tx.qrLoginToken.findUnique({
          where: { id: existing!.id },
          include: { team: true },
        });
        return {
          authResult: null,
          error: this.getQrLoginRejectCode(current, now) ?? 'QR_LOGIN_INVALID',
        };
      }

      const authResult = await this.issueTeamSession(
        existing!.team,
        dto.deviceLabel,
        'TEAM_QR_AUTO_LOGIN',
        tx,
      );

      await tx.activityLog.create({
        data: {
          actorType: ActorType.TEAM,
          actorId: String(existing!.teamId),
          action: 'QR_LOGIN_SUCCESS',
          entityType: 'QR_LOGIN_TOKEN',
          entityId: String(existing!.id),
          metadata: {
            deviceLabel: dto.deviceLabel ?? null,
          },
        },
      });

      return { authResult, error: null };
    });

    if (result.error) {
      await this.logQrLoginRejected(result.error, existing);
      this.throwQrLoginError(result.error);
    }

    return result.authResult!;
  }

  private async issueTeamSession(
    team: TeamForSession,
    deviceLabel: string | undefined,
    loginAction: 'TEAM_LOGIN' | 'TEAM_QR_LOGIN' | 'TEAM_QR_AUTO_LOGIN',
    prisma: PrismaSessionClient = this.prisma,
  ) {
    // Enforce one active device session per team.
    // Revoke any existing active team session before creating a new one.
    const existingSession = await prisma.teamSession.findFirst({
      where: { teamId: team.id, revokedAt: null },
    });
    if (existingSession) {
      await prisma.teamSession.updateMany({
        where: { teamId: team.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'REPLACED' },
      });
      await prisma.activityLog.create({
        data: {
          actorType: ActorType.TEAM,
          actorId: String(team.id),
          action: 'TEAM_SESSION_REPLACED',
          entityType: 'TEAM_SESSION',
          entityId: existingSession.id,
          metadata: { previousDeviceLabel: existingSession.deviceLabel ?? null },
        },
      });
    }

    const session = await prisma.teamSession.create({
      data: {
        teamId: team.id,
        tokenHash: 'pending',
        deviceLabel,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: team.id,
      type: 'TEAM',
      sessionId: session.id,
    });

    await prisma.teamSession.update({
      where: { id: session.id },
      data: { tokenHash: await bcrypt.hash(accessToken, 10) },
    });
    await prisma.team.update({
      where: { id: team.id },
      data: { activeSessionId: session.id },
    });
    await prisma.activityLog.create({
      data: {
        actorType: ActorType.TEAM,
        actorId: String(team.id),
        action: loginAction,
        entityType: 'TEAM',
        entityId: String(team.id),
        metadata: { deviceLabel: deviceLabel ?? null },
      },
    });

    return {
      accessToken,
      team: this.toTeamResponse(team),
    };
  }

  private assertQrLoginRateLimit(tokenHash: string) {
    const now = Date.now();
    const windowMs = 60_000;
    const maxAttempts = 20;
    const current = this.qrLoginAttempts.get(tokenHash);
    if (!current || current.resetAt <= now) {
      this.qrLoginAttempts.set(tokenHash, {
        count: 1,
        resetAt: now + windowMs,
      });
      return;
    }

    current.count += 1;
    if (current.count > maxAttempts) {
      throw new HttpException(
        'QR_LOGIN_RATE_LIMITED',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private getQrLoginRejectCode(
    token:
      | (Prisma.QrLoginTokenGetPayload<{ include: { team: true } }>)
      | null,
    now: Date,
  ) {
    if (!token) {
      return 'QR_LOGIN_INVALID';
    }
    if (token.revokedAt) {
      return 'QR_LOGIN_REVOKED';
    }
    if (token.expiresAt.getTime() <= now.getTime()) {
      return 'QR_LOGIN_EXPIRED';
    }
    // Retain the old error for already-consumed Legacy records only.
    if (token.consumedAt) {
      return 'QR_LOGIN_CONSUMED';
    }
    if (!token.isActive) {
      return 'QR_LOGIN_INVALID';
    }
    if (token.team.status !== 'ACTIVE') {
      return 'QR_LOGIN_INACTIVE_TEAM';
    }
    return null;
  }

  private async logQrLoginRejected(
    reason: string,
    token: Prisma.QrLoginTokenGetPayload<{ include: { team: true } }> | null,
  ) {
    await this.prisma.activityLog.create({
      data: {
        actorType: token ? ActorType.TEAM : ActorType.SYSTEM,
        actorId: token ? String(token.teamId) : 'QR_LOGIN',
        action: 'QR_LOGIN_REJECTED',
        entityType: 'QR_LOGIN_TOKEN',
        entityId: token ? String(token.id) : 'unknown',
        metadata: {
          reason,
        },
      },
    });
  }

  private throwQrLoginError(reason: string): never {
    if (reason === 'QR_LOGIN_INACTIVE_TEAM') {
      throw new ForbiddenException(reason);
    }
    throw new UnauthorizedException(reason);
  }

  async me(auth: AuthContext) {
    if (isTeam(auth)) {
      const team = await this.prisma.team.findUniqueOrThrow({
        where: { id: auth.id },
      });
      return { type: 'TEAM', team: this.toTeamResponse(team) };
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: auth.id },
    });
    return {
      type: 'USER',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async logout(auth: AuthContext) {
    if (isTeam(auth)) {
      await this.prisma.teamSession.updateMany({
        where: { id: auth.sessionId, teamId: auth.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'LOGOUT' },
      });
      await this.prisma.team.updateMany({
        where: { id: auth.id, activeSessionId: auth.sessionId },
        data: { activeSessionId: null },
      });
      await this.prisma.activityLog.create({
        data: {
          actorType: ActorType.TEAM,
          actorId: String(auth.id),
          action: 'TEAM_LOGOUT',
          entityType: 'TEAM_SESSION',
          entityId: auth.sessionId,
        },
      });

      return { success: true };
    }

    await this.prisma.activityLog.create({
      data: {
        actorType: ActorType.USER,
        actorId: String(auth.id),
        userId: auth.id,
        action: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: String(auth.id),
      },
    });

    return { success: true };
  }

  private toTeamResponse(team: {
    id: number;
    name: string;
    username: string;
    captainName: string;
    totalPoints: number;
    maxPossiblePoints: number;
    totalPlaySeconds: number;
    startedAt: Date | null;
    status: string;
    color: string | null;
  }) {
    return {
      id: team.id,
      name: team.name,
      username: team.username,
      captainName: team.captainName,
      totalPoints: team.totalPoints,
      maxPossiblePoints: team.maxPossiblePoints,
      totalPlaySeconds: team.totalPlaySeconds,
      startedAt: team.startedAt,
      status: team.status,
      teamColor: team.color,
      color: team.color,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ActorType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthContext, isTeam } from '../../common/auth/auth-context';
import {
  createQrTokenFingerprint,
  normalizeQrToken,
} from '../../common/qr/qr-token';
import { PrismaService } from '../prisma/prisma.service';
import { TeamLoginDto, UserLoginDto } from './dto/login.dto';
import { TeamQrLoginDto } from './dto/team-qr-login.dto';

@Injectable()
export class AuthService {
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

  private async issueTeamSession(
    team: {
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
    },
    deviceLabel: string | undefined,
    loginAction: 'TEAM_LOGIN' | 'TEAM_QR_LOGIN',
  ) {
    // Enforce one active device session per team.
    // Revoke any existing active team session before creating a new one.
    const existingSession = await this.prisma.teamSession.findFirst({
      where: { teamId: team.id, revokedAt: null },
    });
    if (existingSession) {
      await this.prisma.teamSession.updateMany({
        where: { teamId: team.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'REPLACED' },
      });
      await this.prisma.activityLog.create({
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

    const session = await this.prisma.teamSession.create({
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

    await this.prisma.teamSession.update({
      where: { id: session.id },
      data: { tokenHash: await bcrypt.hash(accessToken, 10) },
    });
    await this.prisma.team.update({
      where: { id: team.id },
      data: { activeSessionId: session.id },
    });
    await this.prisma.activityLog.create({
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
      color: team.color,
    };
  }
}

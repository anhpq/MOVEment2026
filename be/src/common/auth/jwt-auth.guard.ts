import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AuthContext } from './auth-context';

interface JwtPayload {
  sub: number;
  type: 'TEAM' | 'USER';
  role?: string;
  sessionId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      auth?: AuthContext;
    }>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET', 'change-me'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (payload.type === 'TEAM') {
      if (!payload.sessionId) {
        throw new UnauthorizedException('Missing team session');
      }

      const session = await this.prisma.teamSession.findUnique({
        where: { id: payload.sessionId },
      });
      if (!session || session.teamId !== payload.sub || session.revokedAt) {
        throw new UnauthorizedException('SESSION_REPLACED');
      }

      await this.prisma.teamSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });

      request.auth = {
        type: 'TEAM',
        id: payload.sub,
        sessionId: payload.sessionId,
      };
      return true;
    }

    request.auth = {
      type: 'USER',
      id: payload.sub,
      role: payload.role as AuthContext['role'],
    };
    return true;
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorType, Game, ProgressStatus, QrPurpose } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { SubmitScoreDto } from '../../common/dto/score.dto';
import {
  createQrTokenFingerprint,
  normalizeQrToken,
} from '../../common/qr/qr-token';
import { EventConfigService } from '../event-config/event-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamResultsService } from '../team-results/team-results.service';
import { QrActionDto } from './dto/player-actions.dto';

@Injectable()
export class PlayerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventConfig: EventConfigService,
    private readonly activityLog: ActivityLogService,
    private readonly teamResults: TeamResultsService,
  ) {}

  async getDashboard(teamId: number) {
    const [team, progress, leaderboard] = await Promise.all([
      this.prisma.team.findUniqueOrThrow({ where: { id: teamId } }),
      this.getProgress(teamId),
      this.getLeaderboard(),
    ]);
    const rank = leaderboard.find((entry) => entry.teamId === teamId)?.rank ?? null;
    const completedStations = progress.filter((item) => item.status === 'COMPLETED').length;

    return {
      team: {
        id: team.id,
        name: team.name,
        captainName: team.captainName,
        totalPoints: team.totalPoints,
        maxPossiblePoints: team.maxPossiblePoints,
        totalPlaySeconds: team.totalPlaySeconds,
        startedAt: team.startedAt,
        status: team.status,
        teamColor: team.color,
        color: team.color,
        rank,
      },
      completedStations,
      serverNow: new Date().toISOString(),
    };
  }

  async getStations(teamId: number) {
    const [stations, isPastEventEnd] = await Promise.all([
      this.prisma.station.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          games: { where: { isActive: true }, take: 1 },
          progress: { where: { teamId }, take: 1 },
        },
      }),
      this.eventConfig.isPastEventEnd(),
    ]);

    return stations.map((station) => ({
      id: station.id,
      name: station.name,
      description: station.description,
      mapX: station.mapX,
      mapY: station.mapY,
      trackingMode: station.trackingMode,
      isActive: station.isActive,
      game: station.games[0]
        ? {
            id: station.games[0].id,
            title: station.games[0].title,
            type: station.games[0].type,
            difficulty: station.games[0].difficulty,
            maxPoints: station.games[0].maxPoints,
            clueText: station.games[0].clueText,
            mediaUrl: station.games[0].mediaUrl,
          }
        : null,
      progress: station.progress[0]
        ? {
            ...station.progress[0],
            status: this.toEffectiveProgressStatus(
              station.progress[0].status,
              isPastEventEnd,
            ),
          }
        : null,
    }));
  }

  async getProgress(teamId: number) {
    const [progress, isPastEventEnd] = await Promise.all([
      this.prisma.teamStationProgress.findMany({
        where: { teamId },
        include: {
          station: true,
          game: true,
        },
        orderBy: [{ station: { sortOrder: 'asc' } }, { stationId: 'asc' }],
      }),
      this.eventConfig.isPastEventEnd(),
    ]);

    return progress.map(({ game, ...item }) => ({
      ...item,
      status: this.toEffectiveProgressStatus(item.status, isPastEventEnd),
      game: this.toPublicGame(game),
    }));
  }

  async getActivityLog(teamId: number) {
    return this.prisma.activityLog.findMany({
      where: { actorType: ActorType.TEAM, actorId: String(teamId) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getLeaderboard() {
    const results = await this.teamResults.getRankedTeamResults();
    return this.teamResults.toLeaderboardRows(results);
  }

  async checkIn(teamId: number, stationId: string, dto: QrActionDto) {
    if (await this.eventConfig.isPastEventEnd()) {
      throw new ForbiddenException('Stations are closed');
    }

    const qrToken = await this.validateStationQr(dto.qrToken, QrPurpose.CHECK_IN);
    if (qrToken.stationId !== stationId) {
      throw new ForbiddenException('QR token does not match station');
    }
    const progress = await this.getProgressForAction(teamId, qrToken.stationId);
    if (progress.status !== ProgressStatus.AVAILABLE) {
      throw new BadRequestException('Station is not available for check-in');
    }
    if (
      progress.nextCheckInAllowedAt &&
      progress.nextCheckInAllowedAt > new Date()
    ) {
      throw new BadRequestException('Cancel cooldown is still active');
    }

    const activeProgress = await this.prisma.teamStationProgress.findFirst({
      where: {
        teamId,
        stationId: { not: qrToken.stationId },
        status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] },
      },
    });
    if (activeProgress) {
      throw new BadRequestException('Team is already playing another station');
    }

    const updated = await this.prisma.teamStationProgress.update({
      where: { id: progress.id },
      data: {
        status: ProgressStatus.PLAYING,
        checkedInAt: new Date(),
        checkedOutAt: null,
        completedAt: null,
        cancelledAt: null,
        scoreAchieved: 0,
        attemptNo: { increment: 1 },
      },
    });
    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: 'CHECK_IN',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: updated.id,
      metadata: { stationId: qrToken.stationId },
    });
    return updated;
  }

  async checkOut(teamId: number, stationId: string, dto: QrActionDto) {
    const qrToken = await this.validateStationQr(dto.qrToken, QrPurpose.CHECK_OUT);
    if (qrToken.stationId !== stationId) {
      throw new ForbiddenException('QR token does not match station');
    }
    const progress = await this.getProgressForAction(teamId, qrToken.stationId);
    if (
      progress.status !== ProgressStatus.PLAYING &&
      progress.status !== ProgressStatus.CHECKED_IN
    ) {
      throw new BadRequestException('Station is not currently playing');
    }
    if (progress.checkedOutAt) {
      return progress;
    }

    const checkedOutAt =
      progress.station.trackingMode === 'SCORE'
        ? (progress.checkedInAt ?? new Date())
        : new Date();

    if (progress.station.trackingMode === 'TIME') {
      const playSeconds = this.getPlaySeconds(progress.checkedInAt, checkedOutAt);
      const updated = await this.prisma.$transaction(async (tx) => {
        const completed = await tx.teamStationProgress.update({
          where: { id: progress.id },
          data: {
            status: ProgressStatus.COMPLETED,
            checkedOutAt,
            completedAt: checkedOutAt,
            scoreAchieved: 0,
            scoreEnteredByUserId: null,
          },
        });
        await tx.team.update({
          where: { id: teamId },
          data: {
            totalPlaySeconds: playSeconds ? { increment: playSeconds } : undefined,
          },
        });
        return completed;
      });
      await this.activityLog.log({
        actorType: ActorType.TEAM,
        actorId: teamId,
        action: 'CHECK_OUT',
        entityType: 'TEAM_STATION_PROGRESS',
        entityId: updated.id,
        metadata: {
          stationId: qrToken.stationId,
          trackingMode: progress.station.trackingMode,
        },
      });
      return updated;
    }

    const updated = await this.prisma.teamStationProgress.update({
      where: { id: progress.id },
      data: { checkedOutAt },
    });
    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: 'CHECK_OUT',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: updated.id,
      metadata: { stationId: qrToken.stationId },
    });
    return updated;
  }

  async cancel(teamId: number, stationId: string) {
    const progress = await this.getProgressForAction(teamId, stationId);
    if (
      progress.status !== ProgressStatus.PLAYING &&
      progress.status !== ProgressStatus.CHECKED_IN
    ) {
      throw new BadRequestException('Only active station attempts can be cancelled');
    }

    const config = await this.eventConfig.getConfig();
    const now = new Date();
    const nextCheckInAllowedAt = new Date(
      now.getTime() + config.cancelCooldownMinutes * 60_000,
    );
    const updated = await this.prisma.teamStationProgress.update({
      where: { id: progress.id },
      data: {
        status: ProgressStatus.AVAILABLE,
        checkedInAt: null,
        checkedOutAt: null,
        cancelledAt: now,
        nextCheckInAllowedAt,
      },
    });
    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: 'CANCEL_STATION',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: updated.id,
      metadata: { stationId, nextCheckInAllowedAt: nextCheckInAllowedAt.toISOString() },
    });
    return updated;
  }

  async submitScore(teamId: number, stationId: string, dto: SubmitScoreDto) {
    const progress = await this.prisma.teamStationProgress.findUnique({
      where: { teamId_stationId: { teamId, stationId } },
      include: { team: true, game: true, station: true },
    });
    if (!progress) {
      throw new NotFoundException('Progress not found for team/station');
    }
    if (!progress.checkedOutAt || progress.completedAt) {
      throw new BadRequestException('Progress is not waiting for score');
    }
    if (progress.station.trackingMode === 'TIME') {
      throw new BadRequestException('Time-only station does not accept score');
    }
    this.validateScoreValue(dto.score, progress.game.maxPoints);

    const scoreBefore = progress.team.totalPoints;
    const scoreAfter = scoreBefore + dto.score;
    const playSeconds = progress.checkedInAt
      ? Math.max(
          0,
          Math.floor(
            (progress.checkedOutAt.getTime() - progress.checkedInAt.getTime()) / 1000,
          ),
        )
      : 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.teamStationProgress.updateMany({
        where: { id: progress.id, completedAt: null, checkedOutAt: { not: null } },
        data: {
          status: ProgressStatus.COMPLETED,
          completedAt: new Date(),
          scoreAchieved: dto.score,
          scoreEnteredByUserId: null,
        },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('Progress score was already submitted');
      }
      await tx.team.update({
        where: { id: teamId },
        data: {
          totalPoints: { increment: dto.score },
          totalPlaySeconds: { increment: playSeconds },
        },
      });
      await tx.scoreEvent.create({
        data: {
          teamId,
          progressId: progress.id,
          stationId,
          scoreBefore,
          scoreAfter,
          delta: dto.score,
          reason: dto.reason,
        },
      });
      return tx.teamStationProgress.findUniqueOrThrow({ where: { id: progress.id } });
    });

    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: 'SUBMIT_SCORE_BY_STAFF_ON_TEAM_DEVICE',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: progress.id,
      metadata: { stationId, score: dto.score, reason: dto.reason ?? null },
    });
    return updated;
  }

  private async getProgressForAction(teamId: number, stationId: string) {
    const progress = await this.prisma.teamStationProgress.findUnique({
      where: { teamId_stationId: { teamId, stationId } },
      include: { station: true },
    });
    if (!progress) {
      throw new NotFoundException('Progress not found for team/station');
    }
    return progress;
  }

  private async validateStationQr(rawToken: string, expectedPurpose: QrPurpose) {
    const normalizedToken = normalizeQrToken(rawToken);
    const tokenFingerprint = createQrTokenFingerprint(normalizedToken);
    const token = await this.prisma.qrToken.findUnique({
      where: { tokenFingerprint },
      include: { station: true },
    });

    if (!token || !(await bcrypt.compare(normalizedToken, token.tokenHash))) {
      throw new ForbiddenException('Invalid QR token');
    }
    if (!token.isActive || token.revokedAt) {
      throw new ForbiddenException('QR token has been revoked');
    }
    if (token.expiresAt && token.expiresAt <= new Date()) {
      throw new ForbiddenException('QR token has expired');
    }
    if (token.purpose !== expectedPurpose) {
      throw new ForbiddenException('QR token purpose mismatch');
    }
    if (!token.station.isActive) {
      throw new ForbiddenException('Station is inactive');
    }

    return token;
  }

  private getPlaySeconds(checkedInAt: Date | null, checkedOutAt: Date | null) {
    if (!checkedInAt || !checkedOutAt) {
      return 0;
    }
    return Math.max(
      0,
      Math.floor((checkedOutAt.getTime() - checkedInAt.getTime()) / 1000),
    );
  }

  private validateScoreValue(score: number, maxPoints: number) {
    if (!Number.isInteger(score)) {
      throw new BadRequestException('Score must be an integer');
    }
    if (score < 0) {
      throw new BadRequestException('Score must be at least 0');
    }
    if (score > maxPoints) {
      throw new BadRequestException('Score exceeds game max points');
    }
  }

  private toEffectiveProgressStatus(
    status: ProgressStatus,
    isPastEventEnd: boolean,
  ) {
    if (isPastEventEnd && status === ProgressStatus.AVAILABLE) {
      return ProgressStatus.LOCKED;
    }
    return status;
  }

  private toPublicGame(game: Game) {
    return {
      id: game.id,
      stationId: game.stationId,
      title: game.title,
      type: game.type,
      difficulty: game.difficulty,
      maxPoints: game.maxPoints,
      clueText: game.clueText,
      mediaUrl: game.mediaUrl,
      isActive: game.isActive,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };
  }
}

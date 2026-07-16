import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorType, Game, ProgressStatus, QrPurpose } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { TeamSubmitScoreDto } from '../../common/dto/score.dto';
import { EventConfigService } from '../event-config/event-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { QrActionDto, SubmitCipherDto } from './dto/player-actions.dto';

@Injectable()
export class PlayerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventConfig: EventConfigService,
    private readonly activityLog: ActivityLogService,
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
    const teams = await this.prisma.team.findMany({
      where: { status: 'ACTIVE' },
      include: {
        progress: {
          where: { status: ProgressStatus.COMPLETED },
          include: { station: true },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    return teams
      .map((team) => ({
        teamId: team.id,
        teamName: team.name,
        captainName: team.captainName,
        totalPoints: team.totalPoints,
        completedStations: team.progress.length,
        lastStationName: team.progress[0]?.station.name ?? null,
        totalPlaySeconds: team.totalPlaySeconds,
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (a.totalPlaySeconds !== b.totalPlaySeconds) {
          return a.totalPlaySeconds - b.totalPlaySeconds;
        }
        return b.completedStations - a.completedStations;
      })
      .map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  async checkIn(teamId: number, stationId: string, dto: QrActionDto) {
    if (await this.eventConfig.isPastEventEnd()) {
      throw new ForbiddenException('Event has ended; new check-in is locked');
    }

    await this.validateQr(stationId, QrPurpose.CHECK_IN, dto.qrToken);
    const progress = await this.getProgressForAction(teamId, stationId);
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
        stationId: { not: stationId },
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
      metadata: { stationId },
    });
    return updated;
  }

  async checkOut(teamId: number, stationId: string, dto: QrActionDto) {
    await this.validateQr(stationId, QrPurpose.CHECK_OUT, dto.qrToken);
    const progress = await this.getProgressForAction(teamId, stationId);
    if (
      progress.status !== ProgressStatus.PLAYING &&
      progress.status !== ProgressStatus.CHECKED_IN
    ) {
      throw new BadRequestException('Station is not currently playing');
    }
    if (progress.checkedOutAt) {
      return progress;
    }

    const updated = await this.prisma.teamStationProgress.update({
      where: { id: progress.id },
      data: { checkedOutAt: new Date() },
    });
    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: 'CHECK_OUT',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: updated.id,
      metadata: { stationId },
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

  async submitScore(teamId: number, stationId: string, dto: TeamSubmitScoreDto) {
    const [progress, config] = await Promise.all([
      this.prisma.teamStationProgress.findUnique({
        where: { teamId_stationId: { teamId, stationId } },
        include: { team: true, game: true },
      }),
      this.eventConfig.getConfig(),
    ]);
    if (!progress) {
      throw new NotFoundException('Progress not found for team/station');
    }
    if (!(await bcrypt.compare(dto.confirmationCode, config.scoringCodeHash))) {
      throw new ForbiddenException('Invalid scoring confirmation code');
    }
    if (!progress.checkedOutAt || progress.completedAt) {
      throw new BadRequestException('Progress is not waiting for score');
    }
    if (dto.score > progress.game.maxPoints) {
      throw new BadRequestException('Score exceeds game max points');
    }

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

  async submitCipher(teamId: number, stationId: string, dto: SubmitCipherDto) {
    const progress = await this.getProgressForAction(teamId, stationId);
    const game = await this.prisma.game.findUniqueOrThrow({
      where: { id: progress.gameId },
    });
    if (!game.answerHash) {
      throw new BadRequestException('This station does not use cipher validation');
    }

    const normalized = this.normalizeAnswer(dto.answer);
    const isCorrect = await bcrypt.compare(normalized, game.answerHash);
    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: isCorrect ? 'CIPHER_CORRECT' : 'CIPHER_WRONG',
      entityType: 'STATION',
      entityId: stationId,
      metadata: { progressId: progress.id },
    });
    return { isCorrect };
  }

  private async getProgressForAction(teamId: number, stationId: string) {
    const progress = await this.prisma.teamStationProgress.findUnique({
      where: { teamId_stationId: { teamId, stationId } },
    });
    if (!progress) {
      throw new NotFoundException('Progress not found for team/station');
    }
    return progress;
  }

  private async validateQr(
    stationId: string,
    purpose: QrPurpose,
    rawToken: string,
  ) {
    const tokens = await this.prisma.qrToken.findMany({
      where: {
        stationId,
        purpose,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    for (const token of tokens) {
      if (await bcrypt.compare(rawToken, token.tokenHash)) {
        return;
      }
    }
    throw new ForbiddenException('Invalid QR token');
  }

  private normalizeAnswer(answer: string) {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ');
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

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ActorType, Game, ProgressStatus, Team } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import {
  ForceProgressStatusDto,
  ReopenProgressDto,
  SubmitScoreDto,
} from '../../common/dto/score.dto';
import { EventConfigService } from '../event-config/event-config.service';
import { UpdateEventConfigDto } from '../event-config/dto/event-config.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStationDto } from './dto/update-station.dto';
import { CreateStationDto } from './dto/create-station.dto';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import {
  buildTeamLoginQrToken,
  buildStationQrToken,
  createQrTokenFingerprint,
} from '../../common/qr/qr-token';
import { createWorkbookXlsx, XlsxCell, XlsxSheet } from './xlsx-report';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventConfig: EventConfigService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async dashboard() {
    const [
      teamCount,
      stationCount,
      completedCount,
      activePlayingCount,
      latestLogs,
      eventConfig,
    ] = await Promise.all([
      this.prisma.team.count(),
      this.prisma.station.count({ where: { isActive: true } }),
      this.prisma.teamStationProgress.count({
        where: { status: ProgressStatus.COMPLETED },
      }),
      this.prisma.teamStationProgress.count({
        where: { status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] } },
      }),
      this.activityLogs(20),
      this.eventConfig.getPublicConfig(),
    ]);

    return {
      teamCount,
      stationCount,
      completedCount,
      activePlayingCount,
      eventConfig,
      latestLogs,
    };
  }

  async teams() {
    const teams = await this.prisma.team.findMany({
      orderBy: [{ totalPoints: 'desc' }, { totalPlaySeconds: 'asc' }],
    });

    return teams.map((team) => this.toPublicTeam(team));
  }

  async teamProgress(teamId: number) {
    const progress = await this.prisma.teamStationProgress.findMany({
      where: { teamId },
      include: { station: true, game: true },
      orderBy: [{ station: { sortOrder: 'asc' } }, { stationId: 'asc' }],
    });

    return progress.map((item) => this.toPublicProgress(item));
  }

  async createTeam(userId: number, dto: CreateTeamDto) {
    const games = await this.prisma.game.findMany({
      where: { isActive: true, station: { isActive: true } },
      orderBy: [{ station: { sortOrder: 'asc' } }, { id: 'asc' }],
      distinct: ['stationId'],
    });
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const team = await this.prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: dto.name.trim(),
          username: dto.username.trim(),
          captainName: dto.captainName?.trim() || dto.name.trim(),
          passwordHash,
          maxPossiblePoints: games.reduce((sum, game) => sum + game.maxPoints, 0),
        },
      });
      const loginToken = buildTeamLoginQrToken(String(created.id));
      await tx.team.update({
        where: { id: created.id },
        data: {
          loginQrHash: await bcrypt.hash(loginToken, 10),
          loginQrFingerprint: createQrTokenFingerprint(loginToken),
        },
      });
      if (games.length) {
        await tx.teamStationProgress.createMany({
          data: games.map((game) => ({
            teamId: created.id,
            stationId: game.stationId,
            gameId: game.id,
            status: ProgressStatus.AVAILABLE,
          })),
        });
      }
      return tx.team.findUniqueOrThrow({ where: { id: created.id } });
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'CREATE_TEAM',
      entityType: 'TEAM',
      entityId: team.id,
      metadata: { name: team.name, username: team.username },
    });
    return this.toPublicTeam(team);
  }

  async updateTeam(userId: number, teamId: number, dto: UpdateTeamDto) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        name: dto.name?.trim(),
        username: dto.username?.trim(),
        captainName: dto.captainName?.trim(),
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
      },
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'UPDATE_TEAM',
      entityType: 'TEAM',
      entityId: teamId,
      metadata: { name: dto.name ?? null, username: dto.username ?? null },
    });
    return this.toPublicTeam(team);
  }

  async deleteTeam(userId: number, teamId: number) {
    await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    await this.prisma.$transaction(async (tx) => {
      await tx.scoreEvent.deleteMany({ where: { teamId } });
      await tx.finalSubmission.deleteMany({ where: { teamId } });
      await tx.teamStationProgress.deleteMany({ where: { teamId } });
      await tx.teamSession.deleteMany({ where: { teamId } });
      await tx.team.delete({ where: { id: teamId } });
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'DELETE_TEAM',
      entityType: 'TEAM',
      entityId: teamId,
    });
    return { success: true };
  }

  async scoreQueue() {
    const progress = await this.prisma.teamStationProgress.findMany({
      where: {
        checkedOutAt: { not: null },
        completedAt: null,
      },
      include: { team: true, station: true, game: true },
      orderBy: [{ checkedOutAt: 'asc' }, { id: 'asc' }],
    });

    return progress.map(({ team, ...item }) => ({
      ...this.toPublicProgress(item),
      team: this.toPublicTeam(team),
    }));
  }

  async progressMatrix() {
    const [stations, teams] = await Promise.all([
      this.prisma.station.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          games: {
            where: { isActive: true },
            orderBy: { id: 'asc' },
            take: 1,
            select: { type: true, maxPoints: true, mediaUrl: true },
          },
        },
      }),
      this.prisma.team.findMany({
        orderBy: [{ totalPoints: 'desc' }, { totalPlaySeconds: 'asc' }, { id: 'asc' }],
        include: {
          progress: {
            include: { game: true },
            orderBy: [{ station: { sortOrder: 'asc' } }, { stationId: 'asc' }],
          },
        },
      }),
    ]);

    return {
      stations,
      rows: teams.map(({ progress, ...team }) => ({
        team: this.toPublicTeam(team),
        cells: stations.map((station) => {
          const item = progress.find((entry) => entry.stationId === station.id);
          return item
            ? {
                progressId: item.id,
                stationId: item.stationId,
                gameId: item.gameId,
                status: item.status,
                scoreAchieved: item.scoreAchieved,
                maxPoints: item.game.maxPoints,
                checkedInAt: item.checkedInAt,
                checkedOutAt: item.checkedOutAt,
                completedAt: item.completedAt,
                cancelledAt: item.cancelledAt,
                reopenedAt: item.reopenedAt,
              }
            : null;
        }),
      })),
      serverNow: new Date().toISOString(),
    };
  }

  async updateStation(userId: number, stationId: string, dto: UpdateStationDto) {
    const station = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.station.update({
        where: { id: stationId },
        data: {
          name: dto.name,
          description: dto.description,
          trackingMode: dto.trackingMode,
          mapX: dto.mapX,
          mapY: dto.mapY,
        },
      });
      if (dto.mediaUrl !== undefined) {
        await tx.game.updateMany({
          where: { stationId, isActive: true },
          data: { mediaUrl: dto.mediaUrl },
        });
      }
      return updated;
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'UPDATE_STATION',
      entityType: 'STATION',
      entityId: stationId,
      metadata: {
        name: dto.name ?? null,
        description: dto.description ?? null,
        trackingMode: dto.trackingMode ?? null,
        mapX: dto.mapX ?? null,
        mapY: dto.mapY ?? null,
        mediaUrl: dto.mediaUrl ?? null,
      },
    });

    return station;
  }

  async createStation(userId: number, dto: CreateStationDto) {
    const stationId = dto.id.trim().toUpperCase();
    const [teamIds, sortOrder] = await Promise.all([
      this.prisma.team.findMany({ select: { id: true } }),
      this.prisma.station.count(),
    ]);
    const station = await this.prisma.$transaction(async (tx) => {
      const created = await tx.station.create({
        data: {
          id: stationId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          trackingMode: dto.trackingMode,
          mapX: dto.mapX,
          mapY: dto.mapY,
          sortOrder: sortOrder + 1,
        },
      });
      const game = await tx.game.create({
        data: {
          stationId,
          title: `${created.name} Game`,
          type: dto.gameType.trim().toUpperCase(),
          maxPoints: dto.maxPoints,
          mediaUrl: dto.mediaUrl ?? null,
        },
      });
      for (const purpose of ['CHECK_IN', 'CHECK_OUT'] as const) {
        const rawToken = buildStationQrToken(stationId, purpose);
        await tx.qrToken.create({
          data: {
            stationId,
            purpose,
            tokenHash: await bcrypt.hash(rawToken, 10),
            tokenFingerprint: createQrTokenFingerprint(rawToken),
          },
        });
      }
      if (teamIds.length) {
        await tx.teamStationProgress.createMany({
          data: teamIds.map(({ id }) => ({
            teamId: id,
            stationId,
            gameId: game.id,
            status: ProgressStatus.AVAILABLE,
          })),
        });
        await tx.team.updateMany({
          data: { maxPossiblePoints: { increment: dto.maxPoints } },
        });
      }
      return created;
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'CREATE_STATION',
      entityType: 'STATION',
      entityId: stationId,
      metadata: { maxPoints: dto.maxPoints, gameType: dto.gameType },
    });
    return station;
  }

  async deleteStation(userId: number, stationId: string) {
    const game = await this.prisma.game.findFirst({
      where: { stationId, isActive: true },
    });
    const station = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.station.update({
        where: { id: stationId },
        data: { isActive: false },
      });
      await tx.qrToken.updateMany({
        where: { stationId },
        data: { isActive: false },
      });
      await tx.game.updateMany({
        where: { stationId },
        data: { isActive: false },
      });
      if (game?.maxPoints) {
        const teams = await tx.team.findMany({
          select: { id: true, maxPossiblePoints: true },
        });
        for (const team of teams) {
          await tx.team.update({
            where: { id: team.id },
            data: { maxPossiblePoints: Math.max(0, team.maxPossiblePoints - game.maxPoints) },
          });
        }
      }
      return updated;
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'DEACTIVATE_STATION',
      entityType: 'STATION',
      entityId: stationId,
    });
    return { success: true, station };
  }

  async submitScore(userId: number, progressId: number, dto: SubmitScoreDto) {
    const progress = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progressId },
      include: { team: true, game: true, station: true },
    });
    if (!progress.checkedOutAt || progress.completedAt) {
      throw new BadRequestException('Progress is not waiting for score');
    }
    return this.applyScore(userId, progressId, dto.score, dto.reason, false);
  }

  async editScore(userId: number, progressId: number, dto: SubmitScoreDto) {
    if (!dto.reason) {
      throw new BadRequestException('Reason is required when editing score');
    }
    return this.applyScore(userId, progressId, dto.score, dto.reason, true);
  }

  async reopen(userId: number, progressId: number, dto: ReopenProgressDto) {
    if (await this.eventConfig.isPastEventEnd()) {
      throw new ForbiddenException('Cannot reopen after event end time');
    }

    const progress = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progressId },
      include: { team: true },
    });
    const scoreToReverse =
      progress.status === ProgressStatus.COMPLETED ? progress.scoreAchieved : 0;
    const playSecondsToReverse =
      progress.status === ProgressStatus.COMPLETED
        ? this.getPlaySeconds(progress.checkedInAt, progress.checkedOutAt)
        : 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      const reopened = await tx.teamStationProgress.update({
        where: { id: progressId },
        data: {
          status: ProgressStatus.AVAILABLE,
          checkedInAt: null,
          checkedOutAt: null,
          completedAt: null,
          cancelledAt: null,
          reopenedAt: new Date(),
          scoreAchieved: 0,
          notes: dto.reason,
        },
      });
      if (scoreToReverse > 0) {
        const scoreAfter = Math.max(0, progress.team.totalPoints - scoreToReverse);
        await tx.team.update({
          where: { id: progress.teamId },
          data: {
            totalPoints: scoreAfter,
            totalPlaySeconds: Math.max(
              0,
              progress.team.totalPlaySeconds - playSecondsToReverse,
            ),
          },
        });
        await tx.scoreEvent.create({
          data: {
            teamId: progress.teamId,
            progressId,
            stationId: progress.stationId,
            scoreBefore: progress.team.totalPoints,
            scoreAfter,
            delta: -scoreToReverse,
            reason: dto.reason,
            createdByUserId: userId,
          },
        });
      }
      return reopened;
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'REOPEN_PROGRESS',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: progressId,
      metadata: { reason: dto.reason },
    });
    return updated;
  }

  getEventConfig() {
    return this.eventConfig.getPublicConfig();
  }

  updateEventConfig(userId: number, dto: UpdateEventConfigDto) {
    return this.eventConfig.updateConfig(dto, userId);
  }

  async forceStatus(userId: number, progressId: number, dto: ForceProgressStatusDto) {
    if (dto.status === ProgressStatus.COMPLETED) {
      throw new BadRequestException('Use score submission to complete progress');
    }

    const progress = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progressId },
      include: { team: true },
    });
    const wasCompleted = progress.status === ProgressStatus.COMPLETED;
    const scoreToReverse = wasCompleted ? progress.scoreAchieved : 0;
    const playSecondsToReverse = wasCompleted
      ? this.getPlaySeconds(progress.checkedInAt, progress.checkedOutAt)
      : 0;
    const now = new Date();

    const statusData = this.getForceStatusData(dto.status, now);
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedProgress = await tx.teamStationProgress.update({
        where: { id: progressId },
        data: {
          ...statusData,
          notes: dto.reason,
          scoreAchieved: wasCompleted ? 0 : progress.scoreAchieved,
          scoreEnteredByUserId: wasCompleted ? null : progress.scoreEnteredByUserId,
        },
      });

      if (scoreToReverse > 0) {
        const scoreAfter = Math.max(0, progress.team.totalPoints - scoreToReverse);
        await tx.team.update({
          where: { id: progress.teamId },
          data: {
            totalPoints: scoreAfter,
            totalPlaySeconds: Math.max(
              0,
              progress.team.totalPlaySeconds - playSecondsToReverse,
            ),
          },
        });
        await tx.scoreEvent.create({
          data: {
            teamId: progress.teamId,
            progressId,
            stationId: progress.stationId,
            scoreBefore: progress.team.totalPoints,
            scoreAfter,
            delta: -scoreToReverse,
            reason: `Force status ${dto.status}: ${dto.reason}`,
            createdByUserId: userId,
          },
        });
      }

      return updatedProgress;
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'FORCE_PROGRESS_STATUS',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: progressId,
      metadata: {
        fromStatus: progress.status,
        toStatus: dto.status,
        reason: dto.reason,
        reversedScore: scoreToReverse,
      },
    });

    return updated;
  }

  activityLogs(take = 100) {
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async summaryReport(userId: number) {
    const [
      leaderboard,
      progress,
      scoreEvents,
      finalSubmissions,
      activityLogs,
    ] = await Promise.all([
      this.getLeaderboardRows(),
      this.prisma.teamStationProgress.findMany({
        include: {
          team: true,
          station: true,
          game: true,
          scoreEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: [
          { team: { totalPoints: 'desc' } },
          { team: { totalPlaySeconds: 'asc' } },
          { station: { sortOrder: 'asc' } },
        ],
      }),
      this.prisma.scoreEvent.findMany({
        include: { team: true, station: true, createdByUser: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.finalSubmission.findMany({
        include: { team: true, finalChallenge: true },
        orderBy: [{ isCorrect: 'desc' }, { submittedAt: 'asc' }],
      }),
      this.prisma.activityLog.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const sheets: XlsxSheet[] = [
      {
        name: 'Leaderboard',
        rows: [
          [
            'Rank',
            'Team',
            'Captain',
            'Total Score',
            'Max Possible',
            'Completed Stations',
            'Last Station',
            'Total Play Seconds',
          ],
          ...leaderboard.map((entry) => [
            entry.rank,
            entry.teamName,
            entry.captainName,
            entry.totalPoints,
            entry.maxPossiblePoints,
            entry.completedStations,
            entry.lastStationName,
            entry.totalPlaySeconds,
          ]),
        ],
      },
      {
        name: 'Team Progress',
        rows: [
          [
            'Team',
            'Station',
            'Game',
            'Status',
            'Score',
            'Max Points',
            'Checked In',
            'Checked Out',
            'Completed',
            'Last Score Reason',
          ],
          ...progress.map((item) => [
            item.team.name,
            item.station.name,
            item.game.title,
            item.status,
            item.scoreAchieved,
            item.game.maxPoints,
            item.checkedInAt,
            item.checkedOutAt,
            item.completedAt,
            item.scoreEvents[0]?.reason ?? '',
          ]),
        ],
      },
      {
        name: 'Score Events',
        rows: [
          [
            'Created At',
            'Team',
            'Station',
            'Score Before',
            'Score After',
            'Delta',
            'Reason',
            'Created By',
          ],
          ...scoreEvents.map((event) => [
            event.createdAt,
            event.team.name,
            event.station?.name ?? '',
            event.scoreBefore,
            event.scoreAfter,
            event.delta,
            event.reason ?? '',
            event.createdByUser?.username ?? '',
          ]),
        ],
      },
      {
        name: 'Final Submissions',
        rows: [
          [
            'Submitted At',
            'Team',
            'Challenge',
            'Submitted Answer',
            'Correct',
            'Winner Rank',
            'Points Awarded',
          ],
          ...finalSubmissions.map((submission) => [
            submission.submittedAt,
            submission.team.name,
            submission.finalChallenge.title,
            submission.answerSubmitted,
            submission.isCorrect,
            submission.winnerRank ?? '',
            submission.pointsAwarded,
          ]),
        ],
      },
      {
        name: 'Activity Logs',
        rows: [
          ['Created At', 'Actor Type', 'Actor ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'Metadata'],
          ...activityLogs.map((log) => [
            log.createdAt,
            log.actorType,
            log.actorId,
            log.user?.username ?? '',
            log.action,
            log.entityType,
            log.entityId,
            this.stringifyMetadata(log.metadata),
          ]),
        ],
      },
    ].map((sheet) => ({
      ...sheet,
      rows: sheet.rows.map((row) => row.map((cell) => this.toReportCell(cell))),
    }));

    const fileName = `movement-summary-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.xlsx`;
    const buffer = createWorkbookXlsx(sheets);

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'EXPORT_SUMMARY_REPORT',
      entityType: 'REPORT',
      entityId: fileName,
      metadata: {
        sheets: sheets.map((sheet) => sheet.name),
      },
    });

    return { fileName, buffer };
  }

  private async applyScore(
    userId: number,
    progressId: number,
    score: number,
    reason: string | undefined,
    isEdit: boolean,
  ) {
    const progress = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progressId },
      include: { team: true, game: true, station: true },
    });
    if (isEdit && progress.status !== ProgressStatus.COMPLETED) {
      throw new BadRequestException('Only completed progress can be edited');
    }
    if (!isEdit && (!progress.checkedOutAt || progress.completedAt)) {
      throw new BadRequestException('Progress is not waiting for score');
    }
    if (progress.station.trackingMode === 'TIME') {
      throw new BadRequestException('Time-only station does not accept score');
    }
    if (score > progress.game.maxPoints) {
      throw new BadRequestException('Score exceeds game max points');
    }

    const scoreBefore = progress.team.totalPoints;
    const oldProgressScore = isEdit ? progress.scoreAchieved : 0;
    const delta = score - oldProgressScore;
    const scoreAfter = scoreBefore + delta;
    const playSeconds =
      !isEdit && progress.checkedInAt && progress.checkedOutAt
        ? Math.max(
            0,
            Math.floor(
              (progress.checkedOutAt.getTime() - progress.checkedInAt.getTime()) /
                1000,
            ),
          )
        : 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedProgress = await tx.teamStationProgress.update({
        where: { id: progressId },
        data: {
          status: ProgressStatus.COMPLETED,
          completedAt: progress.completedAt ?? new Date(),
          scoreAchieved: score,
          scoreEnteredByUserId: userId,
        },
      });
      await tx.team.update({
        where: { id: progress.teamId },
        data: {
          totalPoints: scoreAfter,
          totalPlaySeconds: playSeconds ? { increment: playSeconds } : undefined,
        },
      });
      await tx.scoreEvent.create({
        data: {
          teamId: progress.teamId,
          progressId,
          stationId: progress.stationId,
          scoreBefore,
          scoreAfter,
          delta,
          reason,
          createdByUserId: userId,
        },
      });
      return updatedProgress;
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: isEdit ? 'EDIT_SCORE' : 'SUBMIT_SCORE',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: progressId,
      metadata: { score, reason: reason ?? null, delta },
    });
    return updated;
  }

  private toPublicProgress<T extends { game: Game }>(progress: T) {
    const { game, ...rest } = progress;
    return {
      ...rest,
      game: this.toPublicGame(game),
    };
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

  private toPublicTeam(team: Team) {
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
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  private async getLeaderboardRows() {
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
        maxPossiblePoints: team.maxPossiblePoints,
        completedStations: team.progress.length,
        lastStationName: team.progress[0]?.station.name ?? '',
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

  private stringifyMetadata(metadata: unknown) {
    if (!metadata) {
      return '';
    }
    return JSON.stringify(metadata);
  }

  private toReportCell(cell: unknown): XlsxCell {
    if (cell instanceof Date) {
      return cell;
    }
    if (
      typeof cell === 'string' ||
      typeof cell === 'number' ||
      typeof cell === 'boolean' ||
      cell === null ||
      cell === undefined
    ) {
      return cell;
    }
    return String(cell);
  }

  private getForceStatusData(status: ProgressStatus, now: Date) {
    switch (status) {
      case ProgressStatus.LOCKED:
        return {
          status,
          checkedInAt: null,
          checkedOutAt: null,
          completedAt: null,
          cancelledAt: null,
          nextCheckInAllowedAt: null,
        };
      case ProgressStatus.AVAILABLE:
        return {
          status,
          checkedInAt: null,
          checkedOutAt: null,
          completedAt: null,
          cancelledAt: null,
          nextCheckInAllowedAt: null,
        };
      case ProgressStatus.CHECKED_IN:
      case ProgressStatus.PLAYING:
        return {
          status,
          checkedInAt: now,
          checkedOutAt: null,
          completedAt: null,
          cancelledAt: null,
          nextCheckInAllowedAt: null,
        };
      case ProgressStatus.COMPLETED:
        throw new BadRequestException('Use score submission to complete progress');
    }
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
}

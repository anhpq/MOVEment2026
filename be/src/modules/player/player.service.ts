import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import {
  ActorType,
  Game,
  Prisma,
  ProgressStatus,
  QrPurpose,
  Station,
  StationImage,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { SubmitScoreDto } from '../../common/dto/score.dto';
import {
  getEffectiveStationMaxPoints,
  getStationPlaySeconds,
  TIME_STATION_AUTO_SCORE,
} from '../../common/station/station-scoring';
import {
  createQrTokenFingerprint,
  normalizeQrToken,
} from '../../common/qr/qr-token';
import { EventConfigService } from '../event-config/event-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamResultsService } from '../team-results/team-results.service';
import { QrActionDto } from './dto/player-actions.dto';
import {
  PLAYER_ERROR_CODES,
  PlayerActionException,
  PlayerErrorCode,
} from './player-error';

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
      this.prisma.team.findUniqueOrThrow({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          captainName: true,
          totalPoints: true,
          maxPossiblePoints: true,
          totalPlaySeconds: true,
          startedAt: true,
          status: true,
          color: true,
        },
      }),
      this.getProgress(teamId),
      this.getPlayerLeaderboard(),
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

  async getCatalog(lang?: string) {
    const locale = this.normalizeLocale(lang);
    const stations = await this.prisma.station.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        mapX: true,
        mapY: true,
        trackingMode: true,
        updatedAt: true,
        images: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: { id: true, updatedAt: true },
        },
        games: {
          where: { isActive: true },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true,
            maxPoints: true,
            clueText: true,
            mediaUrl: true,
            updatedAt: true,
          },
        },
      },
    });

    return {
      catalogVersion: this.buildCatalogVersion(stations),
      stations: stations.map((station) => ({
        id: station.id,
        ...this.toLocalizedStationFields(station, locale),
        mapX: station.mapX,
        mapY: station.mapY,
        trackingMode: station.trackingMode,
        imageCount: station.images.length,
        game: station.games[0]
          ? {
              id: String(station.games[0].id),
              title: station.games[0].title,
              type: station.games[0].type,
              difficulty: station.games[0].difficulty,
              maxPoints: station.games[0].maxPoints,
              clueText: station.games[0].clueText,
              mediaUrl: station.games[0].mediaUrl,
            }
          : null,
      })),
    };
  }

  async getCatalogVersion() {
    const stations = await this.prisma.station.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        updatedAt: true,
        images: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: { id: true, updatedAt: true },
        },
        games: {
          where: { isActive: true },
          orderBy: { id: 'asc' },
          select: { id: true, updatedAt: true },
        },
      },
    });
    return this.buildCatalogVersion(stations);
  }

  async getState(teamId: number) {
    const now = new Date();
    const [team, eventConfig, catalogVersion, leaderboard, finalChallenge] =
      await Promise.all([
        this.prisma.team.findUniqueOrThrow({
          where: { id: teamId },
          select: {
            id: true,
            name: true,
            username: true,
            captainName: true,
            totalPoints: true,
            maxPossiblePoints: true,
            totalPlaySeconds: true,
            status: true,
            color: true,
            progress: {
              orderBy: [{ station: { sortOrder: 'asc' } }, { stationId: 'asc' }],
              select: {
                id: true,
                teamId: true,
                stationId: true,
                status: true,
                checkedInAt: true,
                checkedOutAt: true,
                completedAt: true,
                cancelledAt: true,
                nextCheckInAllowedAt: true,
                scoreAchieved: true,
                attemptNo: true,
              },
            },
          },
        }),
        this.eventConfig.getPublicConfig(),
        this.getCatalogVersion(),
        this.getPlayerLeaderboard(),
        this.prisma.finalChallenge.findFirst({
          where: { isActive: true },
          orderBy: { startsAt: 'asc' },
          select: { id: true },
        }),
      ]);
    const progress = team.progress.map((item) => ({
      ...item,
      status: this.toEffectiveProgressStatus(
        item.status,
        eventConfig.isPastEventEnd,
      ),
    }));
    const activeProgress = progress.find(
      (item) =>
        item.status === ProgressStatus.CHECKED_IN ||
        item.status === ProgressStatus.PLAYING,
    );
    const finalSubmissionState = finalChallenge
      ? await this.getFinalSubmissionState(finalChallenge.id, teamId, now)
      : { hasCorrectSubmission: false, isCoolingDown: false };
    const finalIsOpen =
      Boolean(finalChallenge) &&
      eventConfig.isPastFinalStart &&
      !activeProgress;
    const rank =
      leaderboard.find((entry) => entry.teamId === teamId)?.rank ?? null;

    return {
      catalogVersion,
      serverNow: now.toISOString(),
      team: {
        id: team.id,
        name: team.name,
        username: team.username,
        captainName: team.captainName,
        totalPoints: team.totalPoints,
        maxPossiblePoints: team.maxPossiblePoints,
        totalPlaySeconds: team.totalPlaySeconds,
        status: team.status,
        rank,
        teamColor: team.color,
        color: team.color,
      },
      completedStations: progress.filter(
        (item) => item.status === ProgressStatus.COMPLETED,
      ).length,
      progress,
      final: {
        isOpen: finalIsOpen,
        canSubmit:
          finalIsOpen &&
          !finalSubmissionState.hasCorrectSubmission &&
          !finalSubmissionState.isCoolingDown,
        blockedByActiveStation: Boolean(activeProgress),
        activeStationId: activeProgress?.stationId ?? null,
        finalStartsAt: eventConfig.finalStartsAt,
        eventEndTime: eventConfig.eventEndTime,
      },
    };
  }

  async getStationImages(stationId: string) {
    const station = await this.prisma.station.findFirst({
      where: { id: stationId, isActive: true },
      select: {
        id: true,
        images: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: { url: true },
        },
      },
    });
    if (!station) {
      throw new NotFoundException('Station not found');
    }
    return {
      stationId: station.id,
      imageUrls: station.images.map((image) => image.url),
    };
  }

  async getStations(teamId: number, lang?: string) {
    const locale = this.normalizeLocale(lang);
    const [stations, isPastEventEnd] = await Promise.all([
      this.prisma.station.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            select: { url: true },
          },
          games: { where: { isActive: true }, take: 1 },
          progress: { where: { teamId }, take: 1 },
        },
      }),
      this.eventConfig.isPastEventEnd(),
    ]);

    return stations.map((station) => ({
      id: station.id,
      ...this.toLocalizedStationFields(station, locale),
      mapX: station.mapX,
      mapY: station.mapY,
      trackingMode: station.trackingMode,
      isActive: station.isActive,
      imageUrls: station.images.map(({ url }) => url),
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

  async getProgress(teamId: number, lang?: string) {
    const locale = this.normalizeLocale(lang);
    const [progress, isPastEventEnd] = await Promise.all([
      this.prisma.teamStationProgress.findMany({
        where: { teamId },
        include: {
          station: {
            include: {
              images: {
                orderBy: { sortOrder: 'asc' },
                select: { url: true },
              },
            },
          },
          game: true,
        },
        orderBy: [{ station: { sortOrder: 'asc' } }, { stationId: 'asc' }],
      }),
      this.eventConfig.isPastEventEnd(),
    ]);

    return progress.map(({ game, station, ...item }) => ({
      ...item,
      status: this.toEffectiveProgressStatus(item.status, isPastEventEnd),
      station: this.toPublicStation(station, locale),
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

  async getPlayerLeaderboard() {
    return this.teamResults.getLeanLeaderboard();
  }

  async getStationPlayingCounts() {
    const rows = await this.prisma.teamStationProgress.groupBy({
      by: ['stationId'],
      where: {
        status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] },
        station: { isActive: true },
      },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      stationId: row.stationId,
      playingTeamCount: row._count._all,
    }));
  }

  async qrAction(teamId: number, dto: QrActionDto) {
    const qrToken = await this.validateStationQrToken(dto.qrToken);
    const progress =
      qrToken.purpose === QrPurpose.CHECK_IN
        ? await this.checkInValidated(teamId, qrToken.stationId)
        : await this.checkOutValidated(teamId, qrToken.stationId);

    return {
      action:
        qrToken.purpose === QrPurpose.CHECK_IN ? 'CHECK_IN' : 'CHECK_OUT',
      stationId: qrToken.stationId,
      requiresScore:
        qrToken.purpose === QrPurpose.CHECK_OUT &&
        Boolean(progress.checkedOutAt) &&
        !progress.completedAt,
      progress,
    };
  }

  async checkIn(teamId: number, stationId: string, dto: QrActionDto) {
    await this.assertStationsOpen();
    const qrToken = await this.validateStationQr(dto.qrToken, QrPurpose.CHECK_IN);
    if (qrToken.stationId !== stationId) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.qrStationMismatch,
        'QR token does not match station',
      );
    }
    return this.claimCheckIn(teamId, qrToken.stationId);
  }

  private async checkInValidated(teamId: number, stationId: string) {
    await this.assertStationsOpen();
    return this.claimCheckIn(teamId, stationId);
  }

  private async claimCheckIn(teamId: number, stationId: string) {
    const progress = await this.getProgressForAction(teamId, stationId);
    if (
      (progress.status === ProgressStatus.PLAYING ||
        progress.status === ProgressStatus.CHECKED_IN) &&
      !progress.checkedOutAt &&
      !progress.completedAt
    ) {
      return progress;
    }
    if (progress.status !== ProgressStatus.AVAILABLE) {
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.stationNotAvailable,
        'Station is not available for check-in',
      );
    }
    const activeProgress = await this.prisma.teamStationProgress.findFirst({
      where: {
        teamId,
        stationId: { not: stationId },
        status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] },
      },
      select: { id: true, stationId: true, checkedOutAt: true, completedAt: true },
    });
    if (activeProgress?.checkedOutAt || activeProgress?.completedAt) {
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.activeStationConflict,
        'Complete the pending station score before starting another station',
      );
    }

    let updated;
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        if (activeProgress) {
          const abandoned = await tx.teamStationProgress.updateMany({
            where: {
              id: activeProgress.id,
              teamId,
              checkedOutAt: null,
              completedAt: null,
              status: { in: [ProgressStatus.PLAYING, ProgressStatus.CHECKED_IN] },
            },
            data: {
              status: ProgressStatus.AVAILABLE,
              checkedInAt: null,
              checkedOutAt: null,
              completedAt: null,
              cancelledAt: new Date(),
              nextCheckInAllowedAt: null,
              scoreAchieved: 0,
              scoreEnteredByUserId: null,
            },
          });
          if (abandoned.count !== 1) {
            throw this.playerError(
              HttpStatus.CONFLICT,
              PLAYER_ERROR_CODES.activeStationConflict,
              'Team is already playing another station',
            );
          }
        }
        const claimed = await tx.teamStationProgress.updateMany({
          where: { id: progress.id, teamId, stationId, status: ProgressStatus.AVAILABLE },
          data: {
            status: ProgressStatus.PLAYING,
            checkedInAt: new Date(),
            checkedOutAt: null,
            completedAt: null,
            cancelledAt: null,
            nextCheckInAllowedAt: null,
            scoreAchieved: 0,
            scoreEnteredByUserId: null,
            attemptNo: { increment: 1 },
          },
        });
        const current = await tx.teamStationProgress.findUniqueOrThrow({ where: { id: progress.id } });
        return {claimed, current};
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      const {claimed, current} = result;
      if (claimed.count !== 1) {
        if (
          (current.status === ProgressStatus.PLAYING ||
            current.status === ProgressStatus.CHECKED_IN) &&
          !current.checkedOutAt &&
          !current.completedAt
        ) {
          return current;
        }
        throw this.playerError(
          HttpStatus.CONFLICT,
          PLAYER_ERROR_CODES.stationNotAvailable,
          'Station is not available for check-in',
        );
      }
      updated = current;
    } catch (error) {
      if (this.isConcurrentTransitionError(error)) {
        throw this.playerError(
          HttpStatus.CONFLICT,
          PLAYER_ERROR_CODES.activeStationConflict,
          'Team is already playing another station',
        );
      }
      throw error;
    }
    if (activeProgress) {
      await this.activityLog.log({
        actorType: ActorType.TEAM,
        actorId: teamId,
        action: 'ABANDON_STATION',
        entityType: 'TEAM_STATION_PROGRESS',
        entityId: activeProgress.id,
        metadata: { stationId: activeProgress.stationId, nextStationId: stationId },
      });
    }
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
    const qrToken = await this.validateStationQr(dto.qrToken, QrPurpose.CHECK_OUT);
    if (qrToken.stationId !== stationId) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.qrStationMismatch,
        'QR token does not match station',
      );
    }
    return this.checkOutValidated(teamId, qrToken.stationId);
  }

  private async checkOutValidated(teamId: number, stationId: string) {
    const progress = await this.getProgressForAction(teamId, stationId);
    if (progress.checkedOutAt || progress.completedAt) {
      return progress;
    }
    if (
      progress.status !== ProgressStatus.PLAYING &&
      progress.status !== ProgressStatus.CHECKED_IN
    ) {
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.stationNotPlaying,
        'Station is not currently playing',
      );
    }

    const checkedOutAt = new Date();

    if (progress.station.trackingMode === 'TIME') {
      const autoScore = TIME_STATION_AUTO_SCORE;
      const scoreBefore = progress.team.totalPoints;
      const scoreAfter = scoreBefore + autoScore;
      const playSeconds = getStationPlaySeconds(
        progress.station.trackingMode,
        progress.checkedInAt,
        checkedOutAt,
      );
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const claimed = await tx.teamStationProgress.updateMany({
            where: {
              id: progress.id,
              checkedOutAt: null,
              completedAt: null,
              status: {
                in: [ProgressStatus.PLAYING, ProgressStatus.CHECKED_IN],
              },
            },
            data: {
              status: ProgressStatus.COMPLETED,
              checkedOutAt,
              completedAt: checkedOutAt,
              scoreAchieved: autoScore,
              scoreEnteredByUserId: null,
            },
          });
          if (claimed.count !== 1) {
            const current = await tx.teamStationProgress.findUniqueOrThrow({
              where: { id: progress.id },
            });
            if (current.checkedOutAt || current.completedAt) {
              return { progress: current, transitioned: false };
            }
            throw this.playerError(
              HttpStatus.CONFLICT,
              PLAYER_ERROR_CODES.checkoutConflict,
              'Station check-out was already submitted',
            );
          }
          await tx.team.update({
            where: { id: teamId },
            data: {
              totalPoints: { increment: autoScore },
              totalPlaySeconds: playSeconds
                ? { increment: playSeconds }
                : undefined,
            },
          });
          await tx.scoreEvent.create({
            data: {
              teamId,
              progressId: progress.id,
              stationId,
              scoreBefore,
              scoreAfter,
              delta: autoScore,
              reason: 'TIME_STATION_AUTO_SCORE',
              createdByUserId: null,
            },
          });
          return {
            progress: await tx.teamStationProgress.findUniqueOrThrow({
              where: { id: progress.id },
            }),
            transitioned: true,
          };
        });
        if (result.transitioned) {
          await this.activityLog.log({
            actorType: ActorType.TEAM,
            actorId: teamId,
            action: 'CHECK_OUT',
            entityType: 'TEAM_STATION_PROGRESS',
            entityId: result.progress.id,
            metadata: {
              stationId,
              trackingMode: progress.station.trackingMode,
              autoScore,
              playSeconds,
            },
          });
        }
        return result.progress;
      } catch (error) {
        if (this.isConcurrentTransitionError(error)) {
          throw this.playerError(
            HttpStatus.CONFLICT,
            PLAYER_ERROR_CODES.checkoutConflict,
            'Station check-out was already submitted',
          );
        }
        throw error;
      }
    }

    const claimed = await this.prisma.teamStationProgress.updateMany({
      where: {
        id: progress.id,
        checkedOutAt: null,
        completedAt: null,
        status: { in: [ProgressStatus.PLAYING, ProgressStatus.CHECKED_IN] },
      },
      data: { checkedOutAt },
    });
    const updated = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progress.id },
    });
    if (claimed.count !== 1) {
      if (updated.checkedOutAt || updated.completedAt) {
        return updated;
      }
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.checkoutConflict,
        'Station check-out was already submitted',
      );
    }
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
      progress.status === ProgressStatus.AVAILABLE &&
      Boolean(progress.cancelledAt)
    ) {
      return progress;
    }
    if (
      progress.status !== ProgressStatus.PLAYING &&
      progress.status !== ProgressStatus.CHECKED_IN
    ) {
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.cancelConflict,
        'Only active station attempts can be cancelled',
      );
    }
    if (progress.checkedOutAt || progress.completedAt) {
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.cancelConflict,
        'Only active station attempts can be cancelled',
      );
    }

    const now = new Date();
    const claimed = await this.prisma.teamStationProgress.updateMany({
      where: {
        id: progress.id,
        checkedOutAt: null,
        completedAt: null,
        status: { in: [ProgressStatus.PLAYING, ProgressStatus.CHECKED_IN] },
      },
      data: {
        status: ProgressStatus.AVAILABLE,
        checkedInAt: null,
        checkedOutAt: null,
        cancelledAt: now,
        nextCheckInAllowedAt: null,
      },
    });
    const updated = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progress.id },
    });
    if (claimed.count !== 1) {
      if (
        updated.status === ProgressStatus.AVAILABLE &&
        Boolean(updated.cancelledAt)
      ) {
        return updated;
      }
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.cancelConflict,
        'Only active station attempts can be cancelled',
      );
    }
    await this.activityLog.log({
      actorType: ActorType.TEAM,
      actorId: teamId,
      action: 'CANCEL_STATION',
      entityType: 'TEAM_STATION_PROGRESS',
      entityId: updated.id,
      metadata: { stationId },
    });
    return updated;
  }

  async submitScore(teamId: number, stationId: string, dto: SubmitScoreDto) {
    const progress = await this.prisma.teamStationProgress.findUnique({
      where: { teamId_stationId: { teamId, stationId } },
      include: { team: true, game: true, station: true },
    });
    if (!progress) {
      throw this.playerError(
        HttpStatus.NOT_FOUND,
        PLAYER_ERROR_CODES.progressNotFound,
        'Progress not found for team/station',
      );
    }
    if (progress.completedAt) {
      if (progress.scoreAchieved === dto.score) {
        return progress;
      }
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.scoreConflict,
        'Progress score was already submitted',
      );
    }
    if (!progress.checkedOutAt) {
      throw this.playerError(
        HttpStatus.CONFLICT,
        PLAYER_ERROR_CODES.scoreNotPending,
        'Progress is not waiting for score',
      );
    }
    if (progress.station.trackingMode === 'TIME') {
      throw this.playerError(
        HttpStatus.BAD_REQUEST,
        PLAYER_ERROR_CODES.timeStationScoreForbidden,
        'Time-only station does not accept score',
      );
    }
    this.validateScoreValue(
      dto.score,
      getEffectiveStationMaxPoints(progress.station.trackingMode, progress.game.maxPoints),
    );

    const scoreBefore = progress.team.totalPoints;
    const scoreAfter = scoreBefore + dto.score;
    const playSeconds = getStationPlaySeconds(
      progress.station.trackingMode,
      progress.checkedInAt,
      progress.checkedOutAt,
    );

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.teamStationProgress.updateMany({
          where: {
            id: progress.id,
            completedAt: null,
            checkedOutAt: { not: null },
          },
          data: {
            status: ProgressStatus.COMPLETED,
            completedAt: new Date(),
            scoreAchieved: dto.score,
            scoreEnteredByUserId: null,
          },
        });
        if (claimed.count !== 1) {
          const current = await tx.teamStationProgress.findUniqueOrThrow({
            where: { id: progress.id },
          });
          if (current.completedAt && current.scoreAchieved === dto.score) {
            return { progress: current, transitioned: false };
          }
          throw this.playerError(
            HttpStatus.CONFLICT,
            PLAYER_ERROR_CODES.scoreConflict,
            'Progress score was already submitted',
          );
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
        return {
          progress: await tx.teamStationProgress.findUniqueOrThrow({
            where: { id: progress.id },
          }),
          transitioned: true,
        };
      });

      if (result.transitioned) {
        await this.activityLog.log({
          actorType: ActorType.TEAM,
          actorId: teamId,
          action: 'SUBMIT_SCORE_BY_STAFF_ON_TEAM_DEVICE',
          entityType: 'TEAM_STATION_PROGRESS',
          entityId: progress.id,
          metadata: { stationId, score: dto.score, reason: dto.reason ?? null },
        });
      }
      return result.progress;
    } catch (error) {
      if (this.isConcurrentTransitionError(error)) {
        const current = await this.prisma.teamStationProgress.findUnique({
          where: { id: progress.id },
        });
        if (current?.completedAt && current.scoreAchieved === dto.score) {
          return current;
        }
        throw this.playerError(
          HttpStatus.CONFLICT,
          PLAYER_ERROR_CODES.scoreConflict,
          'Progress score was already submitted',
        );
      }
      throw error;
    }
  }

  private async getProgressForAction(teamId: number, stationId: string) {
    const progress = await this.prisma.teamStationProgress.findUnique({
      where: { teamId_stationId: { teamId, stationId } },
      include: { station: true, team: true, game: true },
    });
    if (!progress) {
      throw this.playerError(
        HttpStatus.NOT_FOUND,
        PLAYER_ERROR_CODES.progressNotFound,
        'Progress not found for team/station',
      );
    }
    return progress;
  }

  private async validateStationQr(rawToken: string, expectedPurpose: QrPurpose) {
    const token = await this.validateStationQrToken(rawToken);

    if (token.purpose !== expectedPurpose) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.qrPurposeMismatch,
        'QR token purpose mismatch',
      );
    }

    return token;
  }

  private async validateStationQrToken(rawToken: string) {
    const normalizedToken = normalizeQrToken(rawToken);
    const tokenFingerprint = createQrTokenFingerprint(normalizedToken);
    const token = await this.prisma.qrToken.findUnique({
      where: { tokenFingerprint },
      include: { station: true },
    });

    if (!token || !(await bcrypt.compare(normalizedToken, token.tokenHash))) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.qrInvalid,
        'Invalid QR token',
      );
    }
    if (!token.isActive || token.revokedAt) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.qrRevoked,
        'QR token has been revoked',
      );
    }
    if (token.expiresAt && token.expiresAt <= new Date()) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.qrExpired,
        'QR token has expired',
      );
    }
    if (!token.station.isActive) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.stationInactive,
        'Station is inactive',
      );
    }

    return token;
  }

  private async assertStationsOpen() {
    if (await this.eventConfig.isPastEventEnd()) {
      throw this.playerError(
        HttpStatus.FORBIDDEN,
        PLAYER_ERROR_CODES.stationsClosed,
        'Stations are closed',
      );
    }
  }

  private playerError(
    status: HttpStatus,
    code: PlayerErrorCode,
    message: string,
  ) {
    return new PlayerActionException(status, code, message);
  }

  private isConcurrentTransitionError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2002' || error.code === 'P2034')
    );
  }

  private buildCatalogVersion(
    stations: Array<{
      id: string;
      updatedAt: Date;
      games: Array<{ id: number; updatedAt: Date }>;
      images: Array<{ id: number; updatedAt: Date }>;
    }>,
  ) {
    const versionInput = stations.map((station) => ({
      id: station.id,
      updatedAt: station.updatedAt.toISOString(),
      games: station.games.map((game) => [
        game.id,
        game.updatedAt.toISOString(),
      ]),
      images: station.images.map((image) => [
        image.id,
        image.updatedAt.toISOString(),
      ]),
    }));
    return createHash('sha256')
      .update(JSON.stringify(versionInput))
      .digest('hex');
  }

  private async getFinalSubmissionState(
    finalChallengeId: number,
    teamId: number,
    now: Date,
  ) {
    const [correctSubmission, wrongAttemptCount, latestWrongSubmission] =
      await Promise.all([
        this.prisma.finalSubmission.findFirst({
          where: { finalChallengeId, teamId, isCorrect: true },
          select: { id: true },
        }),
        this.prisma.finalSubmission.count({
          where: { finalChallengeId, teamId, isCorrect: false },
        }),
        this.prisma.finalSubmission.findFirst({
          where: { finalChallengeId, teamId, isCorrect: false },
          orderBy: { submittedAt: 'desc' },
          select: { submittedAt: true },
        }),
      ]);
    const cooldownSeconds = Math.min(wrongAttemptCount, 10);
    const nextAttemptAt = latestWrongSubmission
      ? new Date(
          latestWrongSubmission.submittedAt.getTime() + cooldownSeconds * 1000,
        )
      : null;
    return {
      hasCorrectSubmission: Boolean(correctSubmission),
      isCoolingDown: Boolean(nextAttemptAt && nextAttemptAt > now),
    };
  }

  private validateScoreValue(score: number, maxPoints: number) {
    if (!Number.isInteger(score)) {
      throw this.playerError(
        HttpStatus.BAD_REQUEST,
        PLAYER_ERROR_CODES.scoreInvalid,
        'Score must be an integer',
      );
    }
    if (score < 0) {
      throw this.playerError(
        HttpStatus.BAD_REQUEST,
        PLAYER_ERROR_CODES.scoreInvalid,
        'Score must be at least 0',
      );
    }
    if (score > maxPoints) {
      throw this.playerError(
        HttpStatus.BAD_REQUEST,
        PLAYER_ERROR_CODES.scoreInvalid,
        'Score exceeds game max points',
      );
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

  private normalizeLocale(lang: string | undefined) {
    return lang?.trim().toLowerCase() === 'en' ? 'en' : 'vi';
  }

  private pickLocalizedValue(primary: string | null | undefined, fallback: string | null) {
    const normalized = primary?.trim();
    return normalized ? normalized : fallback;
  }

  private toLocalizedStationFields(
    station: Pick<Station, 'name' | 'nameEn' | 'description' | 'descriptionEn'>,
    locale: 'vi' | 'en',
  ) {
    if (locale === 'en') {
      return {
        name: this.pickLocalizedValue(station.nameEn, station.name),
        description: this.pickLocalizedValue(station.descriptionEn, station.description),
      };
    }
    return {
      name: station.name,
      description: station.description,
    };
  }

  private toPublicStation(
    station: Station & { images: Pick<StationImage, 'url'>[] },
    locale: 'vi' | 'en',
  ) {
    return {
      id: station.id,
      ...this.toLocalizedStationFields(station, locale),
      mapX: station.mapX,
      mapY: station.mapY,
      latitude: station.latitude,
      longitude: station.longitude,
      trackingMode: station.trackingMode,
      isActive: station.isActive,
      sortOrder: station.sortOrder,
      imageUrls: station.images.map(({ url }) => url),
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
    };
  }
}

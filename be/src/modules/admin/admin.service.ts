import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ActorType,
  Game,
  Prisma,
  ProgressStatus,
  QrPurpose,
  Team,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import {
  AdminScoreDto,
  ForceProgressStatusDto,
  ReopenProgressDto,
} from '../../common/dto/score.dto';
import { EventConfigService } from '../event-config/event-config.service';
import { UpdateEventConfigDto } from '../event-config/dto/event-config.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TeamResultsService } from '../team-results/team-results.service';
import {
  buildTeamResultsWorkbook,
  formatHcmcTimestampForFileName,
} from '../team-results/team-results-excel';
import { UpdateStationDto } from './dto/update-station.dto';
import { CreateStationDto } from './dto/create-station.dto';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import {
  buildQrLoginUrl,
  createSecureStationQrToken,
  createSecureQrLoginToken,
  createQrTokenFingerprint,
  isOfficialQrLoginToken,
  isOfficialStationQrTokenForPurpose,
  normalizeQrToken,
} from '../../common/qr/qr-token';
import { GenerateQrLoginTokenDto } from './dto/qr-login-token.dto';
import { createWorkbookXlsx, XlsxCell, XlsxSheet } from './xlsx-report';
import { isSupportedYoutubeUrl } from '../../common/game/game-type';
import {
  getStationPlaySeconds,
  isReferenceExceeded,
  SCORE_ENTRY_MAX,
} from '../../common/station/station-scoring';

const DEFAULT_STATION_MAX_POINTS = 30;
const MAX_STATION_IMAGES = 10;
const MAX_STATION_IMAGE_URL_LENGTH = 2048;
const QR_EXPORT_TRANSACTION_ATTEMPTS = 3;

type QrCodeExportData = {
  teams: Array<{ teamId: number; loginUrl: string }>;
  stations: Array<{
    stationId: string;
    purpose: QrPurpose;
    rawToken: string;
  }>;
  repaired: {
    teamIds: number[];
    stationTokens: Array<{ stationId: string; purpose: QrPurpose }>;
  };
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventConfig: EventConfigService,
    private readonly activityLog: ActivityLogService,
    private readonly config: ConfigService,
    private readonly teamResults: TeamResultsService,
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
      include: { station: true },
    });
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const teamColor = this.normalizeTeamColorInput(dto);
    const rawQrLoginToken = createSecureQrLoginToken();

    const { team, qrLoginToken } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: dto.name.trim(),
          username: dto.username.trim(),
          captainName: dto.captainName?.trim() || dto.name.trim(),
          passwordHash,
          ...(teamColor !== undefined ? { color: teamColor } : {}),
      maxPossiblePoints: 1785,
        },
      });
      const createdQrLoginToken = await tx.qrLoginToken.create({
        data: {
          teamId: created.id,
          tokenHash: createQrTokenFingerprint(rawQrLoginToken),
          rawToken: rawQrLoginToken,
          expiresAt: null,
          createdByUserId: userId,
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
      return { team: created, qrLoginToken: createdQrLoginToken };
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'CREATE_TEAM',
      entityType: 'TEAM',
      entityId: team.id,
      metadata: { name: team.name, username: team.username, teamColor: team.color },
    });
    const qrLoginUrl = this.buildQrLoginUrl(rawQrLoginToken);
    return {
      ...this.toPublicTeam(team),
      qrLoginUrl,
      loginUrl: qrLoginUrl,
      qrLoginExpiresAt: qrLoginToken.expiresAt,
    };
  }

  async updateTeam(userId: number, teamId: number, dto: UpdateTeamDto) {
    const normalizedQrToken = this.getOptionalQrToken(dto.qrToken);
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const teamColor = this.normalizeTeamColorInput(dto);
    const result = await this.prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data: {
          name: dto.name?.trim(),
          username: dto.username?.trim(),
          captainName: dto.captainName?.trim(),
          passwordHash,
          ...(teamColor !== undefined ? { color: teamColor } : {}),
        },
      });
      const qrLogin = normalizedQrToken
        ? await this.replaceTeamQrLoginToken(tx, userId, teamId, normalizedQrToken)
        : null;
      return { team, qrLogin };
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'UPDATE_TEAM',
      entityType: 'TEAM',
      entityId: teamId,
      metadata: {
        name: dto.name ?? null,
        username: dto.username ?? null,
        teamColor: teamColor ?? null,
        teamColorChanged: teamColor !== undefined,
      },
    });
    return {
      ...this.toPublicTeam(result.team),
      ...(result.qrLogin ? { qrLogin: result.qrLogin } : {}),
    };
  }

  async deleteTeam(userId: number, teamId: number) {
    await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    await this.prisma.$transaction(async (tx) => {
      await tx.scoreEvent.deleteMany({ where: { teamId } });
      await tx.finalSubmission.deleteMany({ where: { teamId } });
      await tx.qrLoginToken.deleteMany({ where: { teamId } });
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

  async listTeamQrLoginTokens(teamId: number) {
    await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    const tokens = await this.prisma.qrLoginToken.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return tokens.map((token) => ({
      id: token.id,
      teamId: token.teamId,
      rawToken: token.rawToken,
      qrLoginUrl: token.rawToken ? this.buildQrLoginUrl(token.rawToken) : undefined,
      loginUrl: token.rawToken ? this.buildQrLoginUrl(token.rawToken) : undefined,
      expiresAt: token.expiresAt,
      isActive: token.isActive,
      consumedAt: token.consumedAt,
      revokedAt: token.revokedAt,
      usageCount: token.usageCount,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      status: this.getQrLoginTokenStatus(token),
    }));
  }

  async generateTeamQrLoginToken(
    userId: number,
    teamId: number,
    _dto: GenerateQrLoginTokenDto,
    rotateExisting = true,
  ) {
    const rawToken = createSecureQrLoginToken();
    const token = await this.prisma.$transaction(async (tx) => {
      const team = await tx.team.findUniqueOrThrow({ where: { id: teamId } });
      if (team.status !== 'ACTIVE') {
        throw new ForbiddenException('QR_LOGIN_INACTIVE_TEAM');
      }
      return this.replaceTeamQrLoginToken(tx, userId, teamId, rawToken);
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: rotateExisting ? 'QR_LOGIN_ROTATED' : 'QR_LOGIN_GENERATED',
      entityType: 'QR_LOGIN_TOKEN',
      entityId: token.id,
      metadata: {
        teamId,
        nonExpiring: true,
      },
    });

    return token;
  }

  async revokeQrLoginToken(userId: number, tokenId: number) {
    const token = await this.prisma.qrLoginToken.update({
      where: { id: tokenId },
      data: { isActive: false, revokedAt: new Date() },
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'QR_LOGIN_REVOKED',
      entityType: 'QR_LOGIN_TOKEN',
      entityId: token.id,
      metadata: { teamId: token.teamId },
    });

    return {
      id: token.id,
      teamId: token.teamId,
      revokedAt: token.revokedAt,
      success: true,
    };
  }

  async revokeActiveTeamQrLoginToken(userId: number, teamId: number) {
    await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    const activeToken = await this.prisma.qrLoginToken.findFirst({
      where: {
        teamId,
        isActive: true,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeToken) {
      return { success: true, teamId, revokedAt: null };
    }

    return this.revokeQrLoginToken(userId, activeToken.id);
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
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
          descriptionEn: true,
          mapX: true,
          mapY: true,
          trackingMode: true,
          images: {
            orderBy: { sortOrder: 'asc' },
            select: { url: true },
          },
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
        select: {
          id: true,
          name: true,
          username: true,
          captainName: true,
          totalPoints: true,
          totalPlaySeconds: true,
          color: true,
          progress: {
            orderBy: [{ station: { sortOrder: 'asc' } }, { stationId: 'asc' }],
            select: {
              id: true,
              stationId: true,
              status: true,
              scoreAchieved: true,
              checkedInAt: true,
              checkedOutAt: true,
              completedAt: true,
              game: { select: { maxPoints: true } },
            },
          },
        },
      }),
    ]);

    return {
      stations: stations.map(({ images, ...station }) => ({
        ...station,
        imageUrls: images.map(({ url }) => url),
      })),
      rows: teams.map(({ progress, ...team }) => ({
        team: {
          id: team.id,
          name: team.name,
          username: team.username,
          captainName: team.captainName,
          totalPoints: team.totalPoints,
          totalPlaySeconds: team.totalPlaySeconds,
          teamColor: team.color,
          color: team.color,
        },
        cells: stations.map((station) => {
          const item = progress.find((entry) => entry.stationId === station.id);
          return item
            ? {
                progressId: item.id,
                stationId: item.stationId,
                status: item.status,
                scoreAchieved: item.scoreAchieved,
                maxPoints: item.game.maxPoints,
                scoreEntryMax: SCORE_ENTRY_MAX,
                referenceExceeded: isReferenceExceeded(
                  item.game.maxPoints,
                  item.scoreAchieved,
                ),
                checkedInAt: item.checkedInAt,
                checkedOutAt: item.checkedOutAt,
                completedAt: item.completedAt,
              }
            : null;
        }),
      })),
    };
  }

  async qrStatusSummary() {
    const now = new Date();
    const [teamTokens, stationTokens] = await Promise.all([
      this.prisma.qrLoginToken.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          teamId: true,
          isActive: true,
          consumedAt: true,
          revokedAt: true,
        },
      }),
      this.prisma.qrToken.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          stationId: true,
          isActive: true,
          expiresAt: true,
          revokedAt: true,
        },
      }),
    ]);

    const teamStatuses = new Map<number, 'ACTIVE' | 'NONE'>();
    for (const token of teamTokens) {
      if (!teamStatuses.has(token.teamId)) {
        teamStatuses.set(token.teamId, 'NONE');
      }
      if (this.getQrLoginTokenStatus(token) === 'ACTIVE') {
        teamStatuses.set(token.teamId, 'ACTIVE');
      }
    }

    const stationStatuses = new Map<
      string,
      { activeCount: number; latestStatus: string }
    >();
    for (const token of stationTokens) {
      const status = this.getStationQrTokenStatus(token, now);
      const current = stationStatuses.get(token.stationId);
      if (!current) {
        stationStatuses.set(token.stationId, {
          activeCount: status === 'ACTIVE' ? 1 : 0,
          latestStatus: status,
        });
      } else if (status === 'ACTIVE') {
        current.activeCount += 1;
      }
    }

    return {
      teams: [...teamStatuses].map(([teamId, status]) => ({ teamId, status })),
      stations: [...stationStatuses].map(
        ([stationId, { activeCount, latestStatus }]) => ({
          stationId,
          activeCount,
          status: activeCount > 0 ? 'ACTIVE' : latestStatus,
        }),
      ),
    };
  }

  async updateStation(userId: number, stationId: string, dto: UpdateStationDto) {
    if (dto.maxPoints !== undefined) {
      this.validateStationReferencePoints(stationId, dto.maxPoints);
    }
    const checkInQrToken = this.getOptionalQrToken(dto.checkInQrToken);
    const checkOutQrToken = this.getOptionalQrToken(dto.checkOutQrToken);
    const imageUrls =
      dto.imageUrls === undefined
        ? undefined
        : this.normalizeStationImageUrls(dto.imageUrls);
    const result = await this.prisma.$transaction(async (tx) => {
      const needsActiveGame =
        dto.trackingMode !== undefined ||
        dto.maxPoints !== undefined ||
        dto.gameType !== undefined ||
        dto.mediaUrl !== undefined;
      const activeGame = needsActiveGame
        ? await tx.game.findFirstOrThrow({
            where: { stationId, isActive: true },
            select: { maxPoints: true, type: true, mediaUrl: true },
          })
        : null;
      if (activeGame) {
        this.validateGameVideoConfiguration(
          dto.gameType ?? activeGame.type,
          dto.mediaUrl !== undefined ? dto.mediaUrl : activeGame.mediaUrl,
        );
      }
      const updated = await tx.station.update({
        where: { id: stationId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn.trim() } : {}),
          ...(dto.description !== undefined ? { description: this.normalizeOptionalText(dto.description) } : {}),
          ...(dto.descriptionEn !== undefined ? { descriptionEn: this.normalizeOptionalText(dto.descriptionEn) } : {}),
          trackingMode: dto.trackingMode,
          mapX: dto.mapX,
          mapY: dto.mapY,
        },
      });
      if (
        dto.mediaUrl !== undefined ||
        dto.gameType !== undefined ||
        dto.maxPoints !== undefined
      ) {
        await tx.game.updateMany({
          where: { stationId, isActive: true },
          data: {
            ...(dto.mediaUrl !== undefined ? { mediaUrl: dto.mediaUrl } : {}),
            ...(dto.gameType !== undefined
              ? { type: dto.gameType.trim().toUpperCase() }
              : {}),
            ...(dto.maxPoints !== undefined ? { maxPoints: dto.maxPoints } : {}),
          },
        });
      }
      if (imageUrls !== undefined) {
        await this.replaceStationImages(tx, stationId, imageUrls);
      }
      const effectiveMaxPoints = SCORE_ENTRY_MAX;
      const qrTokens = [];
      if (checkInQrToken) {
        qrTokens.push(await this.replaceStationQrToken(tx, stationId, QrPurpose.CHECK_IN, checkInQrToken));
      }
      if (checkOutQrToken) {
        qrTokens.push(await this.replaceStationQrToken(tx, stationId, QrPurpose.CHECK_OUT, checkOutQrToken));
      }
      const persistedImages = await tx.stationImage.findMany({
        where: { stationId },
        orderBy: { sortOrder: 'asc' },
        select: { url: true },
      });
      return {
        station: {
          ...updated,
          imageUrls: persistedImages.map(({ url }) => url),
        },
        qrTokens,
        effectiveMaxPoints,
      };
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
        nameEn: dto.nameEn ?? null,
        description: dto.description ?? null,
        descriptionEn: dto.descriptionEn ?? null,
        trackingMode: dto.trackingMode ?? null,
        mapX: dto.mapX ?? null,
        mapY: dto.mapY ?? null,
        gameType: dto.gameType ?? null,
        maxPoints: dto.maxPoints ?? null,
        effectiveMaxPoints:
          result.effectiveMaxPoints === undefined ? null : result.effectiveMaxPoints,
        mediaUrl: dto.mediaUrl ?? null,
        imageCount: imageUrls?.length ?? null,
      },
    });

    return {
      ...result.station,
      ...(result.qrTokens.length ? { qrTokens: result.qrTokens } : {}),
    };
  }

  async createStation(userId: number, dto: CreateStationDto) {
    const stationId = dto.id.trim().toUpperCase();
    this.validateStationReferencePoints(stationId, dto.maxPoints);
    const maxPoints =
      dto.maxPoints === undefined ? DEFAULT_STATION_MAX_POINTS : dto.maxPoints;
    const effectiveMaxPoints = SCORE_ENTRY_MAX;
    const imageUrls = this.normalizeStationImageUrls(dto.imageUrls ?? []);
    this.validateGameVideoConfiguration(dto.gameType, dto.mediaUrl);
    const [teamIds, sortOrder] = await Promise.all([
      this.prisma.team.findMany({ select: { id: true } }),
      this.prisma.station.count(),
    ]);
    const { station, qrTokens } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.station.create({
        data: {
          id: stationId,
          name: dto.name.trim(),
          nameEn: dto.nameEn.trim(),
          description: dto.description?.trim() || null,
          descriptionEn: dto.descriptionEn?.trim() || null,
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
          maxPoints,
          mediaUrl: dto.mediaUrl ?? null,
        },
      });
      if (imageUrls.length) {
        await tx.stationImage.createMany({
          data: imageUrls.map((url, sortOrder) => ({
            stationId,
            url,
            sortOrder,
          })),
        });
      }
      const createdQrTokens = [];
      for (const purpose of [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT]) {
        createdQrTokens.push(await this.createStationQrToken(tx, stationId, purpose));
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
        await tx.team.updateMany({ data: { maxPossiblePoints: 1785 } });
      }
      return {
        station: { ...created, imageUrls },
        qrTokens: createdQrTokens,
      };
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'CREATE_STATION',
      entityType: 'STATION',
      entityId: stationId,
      metadata: {
        maxPoints,
        effectiveMaxPoints,
        gameType: dto.gameType,
        imageCount: imageUrls.length,
      },
    });
    return {
      ...station,
      qrTokens,
    };
  }

  async listStationQrTokens(stationId: string) {
    await this.prisma.station.findUniqueOrThrow({ where: { id: stationId } });
    const tokens = await this.prisma.qrToken.findMany({
      where: { stationId },
      orderBy: [{ purpose: 'asc' }, { createdAt: 'desc' }],
    });
    const now = new Date();
    return tokens.map((token) => ({
      id: token.id,
      stationId: token.stationId,
      purpose: token.purpose,
      schemaVersion: token.schemaVersion,
      rawToken: token.rawToken,
      isActive: token.isActive,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      status: this.getStationQrTokenStatus(token, now),
    }));
  }

  async rotateStationQrToken(userId: number, stationId: string, purpose: QrPurpose) {
    const qrToken = await this.prisma.$transaction(async (tx) => {
      const station = await tx.station.findUniqueOrThrow({ where: { id: stationId } });
      if (!station.isActive) {
        throw new ForbiddenException('STATION_INACTIVE');
      }
      await tx.qrToken.updateMany({
        where: { stationId, purpose, isActive: true },
        data: { isActive: false, revokedAt: new Date() },
      });
      return this.createStationQrToken(tx, stationId, purpose);
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'STATION_QR_ROTATED',
      entityType: 'QR_TOKEN',
      entityId: qrToken.id,
      metadata: { stationId, purpose },
    });

    return qrToken;
  }

  async generateStationQrTokens(userId: number, stationId: string) {
    const qrTokens = await this.prisma.$transaction(async (tx) => {
      const station = await tx.station.findUniqueOrThrow({ where: { id: stationId } });
      if (!station.isActive) {
        throw new ForbiddenException('STATION_INACTIVE');
      }
      return Promise.all([
        this.replaceStationQrToken(tx, stationId, QrPurpose.CHECK_IN),
        this.replaceStationQrToken(tx, stationId, QrPurpose.CHECK_OUT),
      ]);
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'STATION_QR_GENERATED',
      entityType: 'STATION',
      entityId: stationId,
      metadata: { stationId, purposes: [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT] },
    });

    return { stationId, qrTokens };
  }

  async revokeActiveStationQrToken(userId: number, stationId: string, purpose: QrPurpose) {
    await this.prisma.station.findUniqueOrThrow({ where: { id: stationId } });
    const token = await this.prisma.qrToken.findFirst({
      where: { stationId, purpose, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      return { success: true, stationId, purpose, revokedAt: null };
    }

    const revoked = await this.prisma.qrToken.update({
      where: { id: token.id },
      data: { isActive: false, revokedAt: new Date() },
    });

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'STATION_QR_REVOKED',
      entityType: 'QR_TOKEN',
      entityId: revoked.id,
      metadata: { stationId, purpose },
    });

    return {
      success: true,
      id: revoked.id,
      stationId,
      purpose,
      revokedAt: revoked.revokedAt,
    };
  }

  async deleteStation(userId: number, stationId: string) {
    const station = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.station.update({
        where: { id: stationId },
        data: { isActive: false },
      });
      await tx.qrToken.updateMany({
        where: { stationId },
        data: { isActive: false, revokedAt: new Date() },
      });
      await tx.game.updateMany({
        where: { stationId },
        data: { isActive: false },
      });
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

  async submitScore(userId: number, progressId: number, dto: AdminScoreDto) {
    const reason = dto.reason.trim();
    if (!reason) {
      throw new BadRequestException('Reason is required for Admin score changes');
    }
    const progress = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progressId },
      include: { team: true, game: true, station: true },
    });
    if (!progress.checkedOutAt || progress.completedAt) {
      throw new BadRequestException('Progress is not waiting for score');
    }
    return this.applyScore(userId, progressId, dto.score, reason, false);
  }

  async editScore(userId: number, progressId: number, dto: AdminScoreDto) {
    const reason = dto.reason.trim();
    if (!reason) {
      throw new BadRequestException('Reason is required for Admin score changes');
    }
    return this.applyScore(userId, progressId, dto.score, reason, true);
  }

  async reopen(userId: number, progressId: number, dto: ReopenProgressDto) {
    if (await this.eventConfig.isPastEventEnd()) {
      throw new ForbiddenException('Cannot reopen after event end time');
    }

    const progress = await this.prisma.teamStationProgress.findUniqueOrThrow({
      where: { id: progressId },
      include: { team: true, station: true },
    });
    const scoreToReverse =
      progress.status === ProgressStatus.COMPLETED ? progress.scoreAchieved : 0;
    const playSecondsToReverse =
      progress.status === ProgressStatus.COMPLETED
        ? getStationPlaySeconds(
            progress.station.trackingMode,
            progress.checkedInAt,
            progress.checkedOutAt,
          )
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
      include: { team: true, station: true },
    });
    const wasCompleted = progress.status === ProgressStatus.COMPLETED;
    const scoreToReverse = wasCompleted ? progress.scoreAchieved : 0;
    const playSecondsToReverse = wasCompleted
      ? getStationPlaySeconds(
          progress.station.trackingMode,
          progress.checkedInAt,
          progress.checkedOutAt,
        )
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

  async teamResultsReport(userId: number) {
    const results = await this.teamResults.getRankedTeamResults();
    const buffer = await buildTeamResultsWorkbook(results);
    const fileName = `movement-2026-team-results-${formatHcmcTimestampForFileName()}.xlsx`;

    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'EXPORT_TEAM_RESULTS_REPORT',
      entityType: 'REPORT',
      entityId: fileName,
      metadata: {
        teams: results.rows.length,
        activeStations: results.stationColumns.length,
      },
    });

    return { fileName, buffer };
  }

  async qrCodesReport(userId: number) {
    let exportData: QrCodeExportData | undefined;

    for (let attempt = 0; attempt < QR_EXPORT_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        exportData = await this.prisma.$transaction(
          async (tx) => {
            const now = new Date();
            const [teams, stations] = await Promise.all([
              tx.team.findMany({
                where: { status: 'ACTIVE' },
                orderBy: { id: 'asc' },
                select: {
                  id: true,
                  qrLoginTokens: {
                    where: {
                      isActive: true,
                      consumedAt: null,
                      revokedAt: null,
                    },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                  },
                },
              }),
              tx.station.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                select: {
                  id: true,
                  qrTokens: {
                    where: { isActive: true, revokedAt: null },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                  },
                },
              }),
            ]);

            const result: QrCodeExportData = {
              teams: [],
              stations: [],
              repaired: { teamIds: [], stationTokens: [] },
            };

            for (const team of teams) {
              const existing = team.qrLoginTokens.find(
                (token) => (!token.expiresAt || token.expiresAt.getTime() > now.getTime())
                  && typeof token.rawToken === 'string'
                  && token.rawToken.trim(),
              );
              if (existing?.rawToken) {
                result.teams.push({
                  teamId: team.id,
                  loginUrl: this.buildQrLoginUrl(existing.rawToken),
                });
                continue;
              }

              const replacement = await this.replaceTeamQrLoginToken(
                tx,
                userId,
                team.id,
                createSecureQrLoginToken(),
              );
              result.teams.push({ teamId: team.id, loginUrl: replacement.qrLoginUrl });
              result.repaired.teamIds.push(team.id);
            }

            for (const station of stations) {
              for (const purpose of [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT]) {
                const existing = station.qrTokens.find(
                  (token) => token.purpose === purpose
                    && (!token.expiresAt || token.expiresAt.getTime() > now.getTime())
                    && typeof token.rawToken === 'string'
                    && token.rawToken.trim(),
                );
                if (existing?.rawToken) {
                  result.stations.push({
                    stationId: station.id,
                    purpose,
                    rawToken: existing.rawToken,
                  });
                  continue;
                }

                const replacement = await this.createStationQrToken(tx, station.id, purpose);
                result.stations.push({
                  stationId: station.id,
                  purpose,
                  rawToken: replacement.rawToken,
                });
                result.repaired.stationTokens.push({ stationId: station.id, purpose });
              }
            }

            return result;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        const retryable = error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === 'P2034';
        if (!retryable || attempt === QR_EXPORT_TRANSACTION_ATTEMPTS - 1) {
          throw error;
        }
      }
    }

    if (!exportData) {
      throw new BadRequestException('QR_EXPORT_PREPARATION_FAILED');
    }

    const generatedAt = new Date();
    const fileName = `movement-2026-qr-codes-${formatHcmcTimestampForFileName(generatedAt)}.zip`;
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'EXPORT_QR_ARTIFACTS',
      entityType: 'REPORT',
      entityId: fileName,
      metadata: {
        teams: exportData.teams.length,
        stationTokens: exportData.stations.length,
        repairedTeamIds: exportData.repaired.teamIds,
        repairedStationTokens: exportData.repaired.stationTokens,
      },
    });

    return { fileName, generatedAt, ...exportData };
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
      throw new BadRequestException(
        'Only completed progress can have its score corrected',
      );
    }
    if (!isEdit && (!progress.checkedOutAt || progress.completedAt)) {
      throw new BadRequestException('Progress is not waiting for score');
    }
    if (progress.station.trackingMode === 'TIME') {
      throw new BadRequestException('Time-only station does not accept score');
    }
    this.validateScoreValue(score);

    const scoreBefore = progress.team.totalPoints;
    const oldProgressScore = isEdit ? progress.scoreAchieved : 0;
    const delta = score - oldProgressScore;
    const scoreAfter = scoreBefore + delta;
    const playSeconds = !isEdit
      ? getStationPlaySeconds(
          progress.station.trackingMode,
          progress.checkedInAt,
          progress.checkedOutAt,
        )
      : 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      const progressUpdate =
        isEdit
          ? {
              scoreAchieved: score,
              scoreEnteredByUserId: userId,
            }
          : {
              status: ProgressStatus.COMPLETED,
              completedAt: progress.completedAt ?? new Date(),
              scoreAchieved: score,
              scoreEnteredByUserId: userId,
            };
      const updatedProgress = await tx.teamStationProgress.update({
        where: { id: progressId },
        data: progressUpdate,
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
    return {
      ...updated,
      scoreEntryMax: SCORE_ENTRY_MAX,
      referenceExceeded: isReferenceExceeded(progress.game.maxPoints, score),
    };
  }

  private toPublicProgress<T extends { game: Game }>(progress: T) {
    const { game, ...rest } = progress;
    return {
      ...rest,
      game: this.toPublicGame(game),
      scoreEntryMax: SCORE_ENTRY_MAX,
      referenceExceeded: isReferenceExceeded(
        game.maxPoints,
        'scoreAchieved' in rest && typeof rest.scoreAchieved === 'number'
          ? rest.scoreAchieved
          : 0,
      ),
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
      scoreEntryMax: SCORE_ENTRY_MAX,
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
      teamColor: team.color,
      color: team.color,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  private async getLeaderboardRows() {
    return this.teamResults.toLeaderboardRows(
      await this.teamResults.getRankedTeamResults(),
    );
  }

  private stringifyMetadata(metadata: unknown) {
    if (!metadata) {
      return '';
    }
    return JSON.stringify(metadata);
  }

  private normalizeOptionalText(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return value.trim() || null;
  }

  private normalizeStationImageUrls(imageUrls: string[]) {
    if (!Array.isArray(imageUrls) || imageUrls.length > MAX_STATION_IMAGES) {
      throw new BadRequestException(
        `Station gallery supports at most ${MAX_STATION_IMAGES} images`,
      );
    }

    const normalized = imageUrls.map((value) => {
      if (typeof value !== 'string') {
        throw new BadRequestException('Station image URL must be a string');
      }
      const url = value.trim();
      if (!url || url.length > MAX_STATION_IMAGE_URL_LENGTH) {
        throw new BadRequestException(
          `Station image URL must contain 1-${MAX_STATION_IMAGE_URL_LENGTH} characters`,
        );
      }
      try {
        if (new URL(url).protocol !== 'https:') {
          throw new Error('Unsupported protocol');
        }
      } catch {
        throw new BadRequestException(
          'Station image URL must be a valid HTTPS URL',
        );
      }
      return url;
    });

    if (new Set(normalized).size !== normalized.length) {
      throw new BadRequestException('Station image URLs must be unique');
    }
    return normalized;
  }

  private async replaceStationImages(
    tx: Prisma.TransactionClient,
    stationId: string,
    imageUrls: string[],
  ) {
    await tx.stationImage.deleteMany({ where: { stationId } });
    if (imageUrls.length) {
      await tx.stationImage.createMany({
        data: imageUrls.map((url, sortOrder) => ({
          stationId,
          url,
          sortOrder,
        })),
      });
    }
  }

  private validateGameVideoConfiguration(
    gameType: string,
    mediaUrl: string | null | undefined,
  ) {
    if (gameType === 'ST' && !isSupportedYoutubeUrl(mediaUrl)) {
      throw new BadRequestException(
        'ST stations require a valid HTTPS YouTube URL',
      );
    }
  }

  private validateScoreValue(score: number) {
    if (!Number.isInteger(score)) {
      throw new BadRequestException('Score must be an integer');
    }
    if (score < 0) {
      throw new BadRequestException('Score must be at least 0');
    }
    if (score > SCORE_ENTRY_MAX) {
      throw new BadRequestException(`Score must not exceed ${SCORE_ENTRY_MAX}`);
    }
  }

  private validateStationReferencePoints(
    stationId: string,
    referencePoints: number | null | undefined,
  ) {
    if (referencePoints === null && stationId !== 'ST007') {
      throw new BadRequestException(
        'Only ST007 may have an unknown reference point value',
      );
    }
  }

  private buildQrLoginUrl(rawToken: string) {
    const configured =
      this.config.get<string>('FRONTEND_PUBLIC_URL')?.trim() ??
      this.config.get<string>('PUBLIC_FRONTEND_URL')?.trim() ??
      this.config.get<string>('CORS_ORIGIN')?.split(',')[0]?.trim() ??
      'http://localhost:4173';
    return buildQrLoginUrl(configured, rawToken);
  }

  private getOptionalQrToken(rawToken: string | undefined) {
    const normalized = normalizeQrToken(rawToken ?? '');
    return normalized || null;
  }

  private normalizeTeamColorInput(dto: { teamColor?: string | null; color?: string | null }) {
    const hasTeamColor = Object.prototype.hasOwnProperty.call(dto, 'teamColor');
    const hasColor = Object.prototype.hasOwnProperty.call(dto, 'color');
    if (!hasTeamColor && !hasColor) {
      return undefined;
    }
    const teamColor = hasTeamColor ? this.normalizeTeamColorValue(dto.teamColor) : undefined;
    const color = hasColor ? this.normalizeTeamColorValue(dto.color) : undefined;
    if (teamColor !== undefined && color !== undefined && teamColor !== color) {
      throw new BadRequestException('Conflicting teamColor and color values');
    }
    return teamColor !== undefined ? teamColor : color;
  }

  private normalizeTeamColorValue(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const normalized = value.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) {
      throw new BadRequestException('Team color must be #RRGGBB or null');
    }
    return normalized;
  }

  private async replaceTeamQrLoginToken(
    tx: Prisma.TransactionClient,
    userId: number,
    teamId: number,
    rawToken: string,
  ) {
    const normalizedToken = normalizeQrToken(rawToken);
    if (!isOfficialQrLoginToken(normalizedToken)) {
      throw new BadRequestException('Invalid Team QR token format');
    }
    const tokenHash = createQrTokenFingerprint(normalizedToken);
    const duplicate = await tx.qrLoginToken.findUnique({ where: { tokenHash } });
    if (duplicate) {
      throw new BadRequestException('QR token already exists');
    }
    await tx.qrLoginToken.updateMany({
      where: { teamId, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });
    const token = await tx.qrLoginToken.create({
      data: {
        teamId,
        tokenHash,
        rawToken: normalizedToken,
        expiresAt: null,
        createdByUserId: userId,
      },
    });
    const qrLoginUrl = this.buildQrLoginUrl(normalizedToken);
    return {
      id: token.id,
      teamId: token.teamId,
      rawToken: normalizedToken,
      qrLoginUrl,
      loginUrl: qrLoginUrl,
      expiresAt: token.expiresAt,
      usageCount: token.usageCount,
      createdAt: token.createdAt,
      generatedAt: new Date(),
      status: 'ACTIVE',
    };
  }

  private async replaceStationQrToken(
    tx: Prisma.TransactionClient,
    stationId: string,
    purpose: QrPurpose,
    rawToken = createSecureStationQrToken(purpose),
  ) {
    const normalizedToken = normalizeQrToken(rawToken);
    if (!isOfficialStationQrTokenForPurpose(normalizedToken, purpose)) {
      throw new BadRequestException('Invalid Station QR token format');
    }
    const tokenFingerprint = createQrTokenFingerprint(normalizedToken);
    const duplicate = await tx.qrToken.findUnique({ where: { tokenFingerprint } });
    if (duplicate) {
      throw new BadRequestException('QR token already exists');
    }
    await tx.qrToken.updateMany({
      where: { stationId, purpose, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });
    const token = await tx.qrToken.create({
      data: {
        stationId,
        purpose,
        schemaVersion: 'SQ1',
        tokenHash: await bcrypt.hash(normalizedToken, 10),
        tokenFingerprint,
        rawToken: normalizedToken,
      },
    });
    return {
      id: token.id,
      stationId: token.stationId,
      purpose: token.purpose,
      rawToken: normalizedToken,
      schemaVersion: token.schemaVersion,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      generatedAt: new Date(),
      status: 'ACTIVE',
    };
  }

  private async createStationQrToken(
    tx: Prisma.TransactionClient,
    stationId: string,
    purpose: QrPurpose,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.replaceStationQrToken(tx, stationId, purpose);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('STATION_QR_TOKEN_GENERATION_FAILED');
  }

  private getStationQrTokenStatus(
    token: {
      expiresAt: Date | null;
      isActive: boolean;
      revokedAt: Date | null;
    },
    now: Date,
  ) {
    if (token.revokedAt) return 'REVOKED';
    if (token.expiresAt && token.expiresAt.getTime() <= now.getTime()) {
      return 'EXPIRED';
    }
    if (!token.isActive) return 'INACTIVE';
    return 'ACTIVE';
  }

  private getQrLoginTokenStatus(token: {
    isActive: boolean;
    consumedAt: Date | null;
    revokedAt: Date | null;
  }) {
    if (token.revokedAt) return 'REVOKED';
    if (token.consumedAt) return 'CONSUMED';
    if (!token.isActive) return 'INACTIVE';
    return 'ACTIVE';
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

}

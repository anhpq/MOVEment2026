import { ConflictException, BadRequestException } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  ProgressStatus,
  QrPurpose,
  TeamStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  CANONICAL_QR_TOKEN_COUNT,
  CANONICAL_STATION_COUNT,
  CANONICAL_TOTAL_MAX_SCORE,
} from '../../../prisma/station-seed-data';
import {
  createQrTokenFingerprint,
  createSecureQrLoginToken,
  createSecureStationQrToken,
} from '../qr/qr-token';

export const EVENT_PREPARATION_CONFIRMATION = 'RESET MOVEMENT2026 GAMEPLAY';
export const EVENT_PREPARATION_RESET_CUTOFF = new Date('2026-08-26T23:00:00.000Z');

const EVENT_PREPARATION_LOCK_ID = 2_026_082_706;

type EventPreparationDb = PrismaClient | Prisma.TransactionClient;

export type EventPreparationInventory = {
  teams: number;
  activeStations: number;
  activeGames: number;
  activeTeamQrTokens: number;
  activeStationQrTokens: number;
  eventConfigRows: number;
  activeFinalChallenges: number;
  ready: boolean;
  issues: string[];
};

export type GameplayResetResult = {
  teams: number;
  progressRows: number;
  teamSessions: number;
  scoreEvents: number;
  finalSubmissions: number;
  activityLogs: number;
};

export type QrRotationResult = {
  teams: number;
  stations: number;
  teamQrTokens: number;
  stationQrTokens: number;
  revokedTeamSessions: number;
};

function activeTeamTokenWhere() {
  return { isActive: true, revokedAt: null, consumedAt: null };
}

function activeStationTokenWhere(now: Date) {
  return {
    isActive: true,
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export function isEventPreparationResetAvailable(now = new Date()) {
  return now.getTime() < EVENT_PREPARATION_RESET_CUTOFF.getTime();
}

export function assertEventPreparationConfirmation(
  confirmation: string,
  backupConfirmed: boolean,
) {
  if (confirmation.trim() !== EVENT_PREPARATION_CONFIRMATION) {
    throw new BadRequestException('EVENT_PREPARATION_CONFIRMATION_REQUIRED');
  }
  if (!backupConfirmed) {
    throw new BadRequestException('EVENT_PREPARATION_BACKUP_CONFIRMATION_REQUIRED');
  }
}

export async function readEventPreparationInventory(
  db: EventPreparationDb,
  now = new Date(),
): Promise<EventPreparationInventory> {
  const [teams, stations, games, teamTokens, stationTokens, eventConfigRows, activeFinalChallenges] =
    await Promise.all([
      db.team.findMany({ select: { id: true } }),
      db.station.findMany({ where: { isActive: true }, select: { id: true } }),
      db.game.findMany({
        where: { isActive: true, station: { isActive: true } },
        select: { stationId: true },
      }),
      db.qrLoginToken.findMany({
        where: activeTeamTokenWhere(),
        select: { teamId: true, expiresAt: true },
      }),
      db.qrToken.findMany({
        where: activeStationTokenWhere(now),
        select: { stationId: true, purpose: true },
      }),
      db.eventConfig.count(),
      db.finalChallenge.count({ where: { isActive: true } }),
    ]);

  const issues: string[] = [];
  const stationIds = new Set(stations.map((station) => station.id));
  const gameCountByStation = new Map<string, number>();
  for (const game of games) {
    gameCountByStation.set(game.stationId, (gameCountByStation.get(game.stationId) ?? 0) + 1);
  }
  const teamTokenCountByTeam = new Map<number, number>();
  for (const token of teamTokens) {
    teamTokenCountByTeam.set(token.teamId, (teamTokenCountByTeam.get(token.teamId) ?? 0) + 1);
    if (token.expiresAt !== null) {
      issues.push('TEAM_QR_MUST_BE_NON_EXPIRING');
    }
  }
  const stationTokenCountByPair = new Map<string, number>();
  for (const token of stationTokens) {
    const key = `${token.stationId}:${token.purpose}`;
    stationTokenCountByPair.set(key, (stationTokenCountByPair.get(key) ?? 0) + 1);
  }

  if (stations.length !== CANONICAL_STATION_COUNT) {
    issues.push('CANONICAL_STATION_COUNT_MISMATCH');
  }
  if (games.length !== stations.length || [...stationIds].some((id) => gameCountByStation.get(id) !== 1)) {
    issues.push('ACTIVE_GAME_INVENTORY_INVALID');
  }
  if (teams.some((team) => teamTokenCountByTeam.get(team.id) !== 1)) {
    issues.push('TEAM_QR_INVENTORY_INVALID');
  }
  if (
    stationTokens.length !== CANONICAL_QR_TOKEN_COUNT ||
    [...stationIds].some((stationId) =>
      [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT].some(
        (purpose) => stationTokenCountByPair.get(`${stationId}:${purpose}`) !== 1,
      ),
    )
  ) {
    issues.push('STATION_QR_INVENTORY_INVALID');
  }
  if (eventConfigRows !== 1) {
    issues.push('EVENT_CONFIG_INVENTORY_INVALID');
  }
  if (activeFinalChallenges < 1) {
    issues.push('ACTIVE_FINAL_CHALLENGE_MISSING');
  }

  return {
    teams: teams.length,
    activeStations: stations.length,
    activeGames: games.length,
    activeTeamQrTokens: teamTokens.length,
    activeStationQrTokens: stationTokens.length,
    eventConfigRows,
    activeFinalChallenges,
    ready: issues.length === 0,
    issues: [...new Set(issues)],
  };
}

export function assertEventPreparationInventory(inventory: EventPreparationInventory) {
  if (!inventory.ready) {
    throw new BadRequestException({
      code: 'EVENT_PREPARATION_INVENTORY_INVALID',
      issues: inventory.issues,
    });
  }
}

export async function acquireEventPreparationLock(tx: Prisma.TransactionClient) {
  const lock = await tx.$queryRaw<Array<{ locked: boolean }>>(
    Prisma.sql`SELECT pg_try_advisory_xact_lock(${EVENT_PREPARATION_LOCK_ID}) AS locked`,
  );
  if (!lock[0]?.locked) {
    throw new ConflictException('EVENT_PREPARATION_OPERATION_IN_PROGRESS');
  }
}

export async function resetGameplayInTransaction(
  tx: Prisma.TransactionClient,
  now = new Date(),
): Promise<GameplayResetResult> {
  const inventory = await readEventPreparationInventory(tx, now);
  assertEventPreparationInventory(inventory);
  const [teams, games] = await Promise.all([
    tx.team.findMany({ select: { id: true } }),
    tx.game.findMany({
      where: { isActive: true, station: { isActive: true } },
      select: { id: true, stationId: true },
      orderBy: [{ stationId: 'asc' }, { id: 'asc' }],
    }),
  ]);

  await tx.teamSession.deleteMany();
  await tx.scoreEvent.deleteMany();
  await tx.finalSubmission.deleteMany();
  await tx.teamStationProgress.deleteMany();
  await tx.activityLog.deleteMany();
  await tx.team.updateMany({
    data: {
      totalPoints: 0,
      totalPlaySeconds: 0,
      maxPossiblePoints: CANONICAL_TOTAL_MAX_SCORE,
      startedAt: null,
      status: TeamStatus.ACTIVE,
      activeSessionId: null,
    },
  });
  await tx.qrLoginToken.updateMany({
    where: activeTeamTokenWhere(),
    data: { usageCount: 0, lastUsedAt: null },
  });
  await tx.teamStationProgress.createMany({
    data: teams.flatMap((team) => games.map((game) => ({
      teamId: team.id,
      stationId: game.stationId,
      gameId: game.id,
      status: ProgressStatus.AVAILABLE,
    }))),
  });

  const [remainingSessions, remainingScores, remainingFinalSubmissions, remainingLogs, progressRows] =
    await Promise.all([
      tx.teamSession.count(),
      tx.scoreEvent.count(),
      tx.finalSubmission.count(),
      tx.activityLog.count(),
      tx.teamStationProgress.count(),
    ]);
  if (
    remainingSessions !== 0 ||
    remainingScores !== 0 ||
    remainingFinalSubmissions !== 0 ||
    remainingLogs !== 0 ||
    progressRows !== teams.length * games.length
  ) {
    throw new Error('EVENT_PREPARATION_RESET_VERIFICATION_FAILED');
  }

  return {
    teams: teams.length,
    progressRows,
    teamSessions: remainingSessions,
    scoreEvents: remainingScores,
    finalSubmissions: remainingFinalSubmissions,
    activityLogs: remainingLogs,
  };
}

async function createUniqueTeamQrToken(tx: Prisma.TransactionClient, teamId: number) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rawToken = createSecureQrLoginToken();
    const tokenHash = createQrTokenFingerprint(rawToken);
    if (await tx.qrLoginToken.findUnique({ where: { tokenHash } })) {
      continue;
    }
    await tx.qrLoginToken.create({
      data: { teamId, tokenHash, rawToken, expiresAt: null },
    });
    return;
  }
  throw new Error('EVENT_PREPARATION_TEAM_QR_GENERATION_FAILED');
}

async function createUniqueStationQrToken(
  tx: Prisma.TransactionClient,
  stationId: string,
  purpose: QrPurpose,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rawToken = createSecureStationQrToken(purpose);
    const tokenFingerprint = createQrTokenFingerprint(rawToken);
    if (await tx.qrToken.findUnique({ where: { tokenFingerprint } })) {
      continue;
    }
    await tx.qrToken.create({
      data: {
        stationId,
        purpose,
        schemaVersion: 'SQ1',
        tokenHash: await bcrypt.hash(rawToken, 10),
        tokenFingerprint,
        rawToken,
      },
    });
    return;
  }
  throw new Error('EVENT_PREPARATION_STATION_QR_GENERATION_FAILED');
}

export async function rotateAllQrInTransaction(
  tx: Prisma.TransactionClient,
  now = new Date(),
): Promise<QrRotationResult> {
  const inventory = await readEventPreparationInventory(tx, now);
  assertEventPreparationInventory(inventory);
  const [teams, stations, revokedSessions] = await Promise.all([
    tx.team.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
    tx.station.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    tx.teamSession.deleteMany(),
  ]);
  await tx.team.updateMany({ data: { activeSessionId: null } });
  await tx.qrLoginToken.updateMany({
    where: { isActive: true, revokedAt: null },
    data: { isActive: false, revokedAt: now },
  });
  await tx.qrToken.updateMany({
    where: { stationId: { in: stations.map((station) => station.id) }, isActive: true, revokedAt: null },
    data: { isActive: false, revokedAt: now },
  });
  for (const team of teams) {
    await createUniqueTeamQrToken(tx, team.id);
  }
  for (const station of stations) {
    await createUniqueStationQrToken(tx, station.id, QrPurpose.CHECK_IN);
    await createUniqueStationQrToken(tx, station.id, QrPurpose.CHECK_OUT);
  }

  assertEventPreparationInventory(await readEventPreparationInventory(tx, now));
  return {
    teams: teams.length,
    stations: stations.length,
    teamQrTokens: teams.length,
    stationQrTokens: stations.length * 2,
    revokedTeamSessions: revokedSessions.count,
  };
}

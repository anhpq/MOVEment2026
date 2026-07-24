import { Prisma, ProgressStatus, QrPurpose, TeamStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createQrTokenFingerprint, createSecureStationQrToken } from '../src/common/qr/qr-token';
import {
  CANONICAL_QR_PURPOSES,
  CANONICAL_QR_TOKEN_COUNT,
  CANONICAL_STANDARD_COUNT,
  CANONICAL_STATIONS,
  CANONICAL_STATION_COUNT,
  CANONICAL_STATION_IDS,
  CANONICAL_ST_COUNT,
  CANONICAL_TOTAL_MAX_SCORE,
} from './station-seed-data';

export type StationReplacementResult = {
  stations: number;
  games: number;
  qrTokens: number;
  teams: number;
  progressRows: number;
};

async function createUniqueStationQrToken(tx: Prisma.TransactionClient, purpose: QrPurpose) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rawToken = createSecureStationQrToken(purpose);
    const fingerprint = createQrTokenFingerprint(rawToken);
    const existing = await tx.qrToken.findUnique({ where: { tokenFingerprint: fingerprint } });
    if (!existing) {
      return { rawToken, fingerprint };
    }
  }
  throw new Error('STATION_QR_TOKEN_GENERATION_FAILED');
}

async function deleteStationRelatedActivityLogs(
  tx: Prisma.TransactionClient,
  stationIds: string[],
  progressIds: string[],
) {
  const stationSql = stationIds.length ? Prisma.sql`OR "entity_id" IN (${Prisma.join(stationIds)}) OR metadata->>'stationId' IN (${Prisma.join(stationIds)})` : Prisma.empty;
  const progressSql = progressIds.length ? Prisma.sql`OR ("entity_type" = 'TEAM_STATION_PROGRESS' AND "entity_id" IN (${Prisma.join(progressIds)}))` : Prisma.empty;
  const metadataTextSql = stationIds.length
    ? Prisma.sql`OR (${Prisma.join(stationIds.map((stationId) => Prisma.sql`metadata::text LIKE ${`%${stationId}%`}`), ' OR ')})`
    : Prisma.empty;
  await tx.$executeRaw(Prisma.sql`
    DELETE FROM "activity_logs"
    WHERE "entity_type" = 'STATION'
      OR "action" IN ('FINAL_SUBMIT_CORRECT', 'FINAL_SUBMIT_WRONG')
      ${progressSql}
      ${stationSql}
      ${metadataTextSql}
  `);
}

export async function replaceAllStations(tx: Prisma.TransactionClient): Promise<StationReplacementResult> {
  const [existingStations, existingProgress, teams] = await Promise.all([
    tx.station.findMany({ select: { id: true } }),
    tx.teamStationProgress.findMany({ select: { id: true } }),
    tx.team.findMany({ select: { id: true } }),
  ]);
  const stationIds = Array.from(new Set([...existingStations.map(({ id }) => id), ...CANONICAL_STATION_IDS]));
  const progressIds = existingProgress.map(({ id }) => String(id));

  await deleteStationRelatedActivityLogs(tx, stationIds, progressIds);
  await tx.finalSubmission.deleteMany();
  await tx.scoreEvent.deleteMany();
  await tx.teamStationProgress.deleteMany();
  await tx.qrToken.deleteMany();
  await tx.game.deleteMany();
  await tx.station.deleteMany();

  const games = new Map<string, number>();
  for (const station of CANONICAL_STATIONS) {
    await tx.station.create({
      data: {
        id: station.id,
        name: station.name,
        description: station.shortDescription,
        mapX: station.mapX,
        mapY: station.mapY,
        trackingMode: 'BOTH',
        isActive: true,
        sortOrder: station.sortOrder,
      },
    });
    const game = await tx.game.create({
      data: {
        stationId: station.id,
        title: `${station.name} Game`,
        type: station.gameType,
        maxPoints: station.maxScore,
        mediaUrl: station.mediaUrl,
        isActive: true,
      },
    });
    games.set(station.id, game.id);
    for (const purpose of CANONICAL_QR_PURPOSES) {
      const { rawToken, fingerprint } = await createUniqueStationQrToken(tx, purpose);
      await tx.qrToken.create({
        data: {
          stationId: station.id,
          purpose,
          schemaVersion: 'SQ1',
          tokenHash: await bcrypt.hash(rawToken, 10),
          tokenFingerprint: fingerprint,
          rawToken,
        },
      });
    }
  }

  if (teams.length) {
    await tx.teamStationProgress.createMany({
      data: teams.flatMap(({ id: teamId }) => CANONICAL_STATIONS.map((station) => ({
        teamId,
        stationId: station.id,
        gameId: games.get(station.id) as number,
        status: ProgressStatus.AVAILABLE,
      }))),
    });
  }
  await tx.team.updateMany({
    data: {
      totalPoints: 0,
      totalPlaySeconds: 0,
      startedAt: null,
      status: TeamStatus.ACTIVE,
      maxPossiblePoints: CANONICAL_TOTAL_MAX_SCORE,
    },
  });

  await verifyCanonicalStationState(tx, teams.length);
  return {
    stations: CANONICAL_STATION_COUNT,
    games: CANONICAL_STATION_COUNT,
    qrTokens: CANONICAL_QR_TOKEN_COUNT,
    teams: teams.length,
    progressRows: teams.length * CANONICAL_STATION_COUNT,
  };
}

export async function verifyCanonicalStationState(tx: Prisma.TransactionClient, expectedTeamCount?: number) {
  const now = new Date();
  const [stations, games, qrTokens, progressRows, teams, scoreEvents, finalSubmissions] = await Promise.all([
    tx.station.findMany({ select: { id: true, isActive: true } }),
    tx.game.findMany({ where: { stationId: { in: CANONICAL_STATION_IDS }, isActive: true }, select: { type: true, maxPoints: true } }),
    tx.qrToken.findMany({
      where: {
        stationId: { in: CANONICAL_STATION_IDS },
        isActive: true,
        revokedAt: null,
        schemaVersion: 'SQ1',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { stationId: true, purpose: true },
    }),
    tx.teamStationProgress.findMany({ select: { teamId: true, stationId: true, status: true } }),
    tx.team.findMany({ select: { id: true, maxPossiblePoints: true, totalPoints: true, totalPlaySeconds: true, startedAt: true, status: true } }),
    tx.scoreEvent.count(),
    tx.finalSubmission.count(),
  ]);
  if (stations.length !== CANONICAL_STATION_COUNT || stations.some((station) => !station.isActive || !CANONICAL_STATION_IDS.includes(station.id))) {
    throw new Error('Canonical Station verification failed');
  }
  const stGames = games.filter((game) => game.type === 'ST').length;
  const standardGames = games.filter((game) => game.type === 'STANDARD').length;
  if (games.length !== CANONICAL_STATION_COUNT || stGames !== CANONICAL_ST_COUNT || standardGames !== CANONICAL_STANDARD_COUNT) {
    throw new Error('Canonical Game verification failed');
  }
  if (qrTokens.length !== CANONICAL_QR_TOKEN_COUNT) {
    throw new Error('Canonical Station QR token count verification failed');
  }
  for (const stationId of CANONICAL_STATION_IDS) {
    for (const purpose of CANONICAL_QR_PURPOSES) {
      if (qrTokens.filter((token) => token.stationId === stationId && token.purpose === purpose).length !== 1) {
        throw new Error(`Canonical QR pair verification failed for ${stationId} ${purpose}`);
      }
    }
  }
  if (progressRows.some((progress) => !CANONICAL_STATION_IDS.includes(progress.stationId))) {
    throw new Error('Non-canonical Station progress remains');
  }
  for (const team of teams) {
    const teamProgress = progressRows.filter((progress) => progress.teamId === team.id);
    if (teamProgress.length !== CANONICAL_STATION_COUNT || teamProgress.some((progress) => progress.status !== ProgressStatus.AVAILABLE)) {
      throw new Error(`Canonical progress verification failed for Team ${team.id}`);
    }
    if (team.maxPossiblePoints !== CANONICAL_TOTAL_MAX_SCORE || team.totalPoints !== 0 || team.totalPlaySeconds !== 0 || team.startedAt !== null || team.status !== TeamStatus.ACTIVE) {
      throw new Error(`Team scoring reset verification failed for Team ${team.id}`);
    }
  }
  if (expectedTeamCount !== undefined && teams.length !== expectedTeamCount) {
    throw new Error('Team count changed during Station replacement');
  }
  if (scoreEvents !== 0 || finalSubmissions !== 0) {
    throw new Error('Scoring reset verification failed');
  }
}

import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  CANONICAL_QR_TOKEN_COUNT,
  CANONICAL_STATIONS,
  CANONICAL_STANDARD_COUNT,
  CANONICAL_STATION_COUNT,
  CANONICAL_STATION_IDS,
  CANONICAL_ST_COUNT,
  CANONICAL_TOTAL_MAX_SCORE,
  validateCanonicalStations,
} from '../prisma/station-seed-data';
import { replaceAllStations } from '../prisma/station-replacement';

const prisma = new PrismaClient();
const auditOnly = process.argv.includes('--audit-only');
const confirmReplace = process.env.CONFIRM_REPLACE_ALL_PROD_STATIONS === 'YES';

type SafeDatabaseTarget = {
  nodeEnv: string;
  appEnv: string;
  host: string;
  database: string;
  productionLike: boolean;
};

type AuditSnapshot = Awaited<ReturnType<typeof collectAudit>>;

function getSafeDatabaseTarget(): SafeDatabaseTarget {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  const parsed = new URL(databaseUrl);
  const host = parsed.hostname;
  const database = parsed.pathname.replace(/^\//, '');
  const nodeEnv = process.env.NODE_ENV ?? '';
  const appEnv = process.env.APP_ENV ?? '';
  const targetText = `${host} ${database}`.toLowerCase();
  return {
    nodeEnv,
    appEnv,
    host,
    database,
    productionLike:
      nodeEnv.toLowerCase() === 'production' ||
      appEnv.toLowerCase() === 'production' ||
      targetText.includes('prod') ||
      targetText.includes('production'),
  };
}

async function getGameTypeConstraintValues() {
  const constraints = await prisma.$queryRaw<Array<{ name: string; definition: string }>>(Prisma.sql`
    SELECT c.conname AS name, pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'games'
      AND c.conname = 'games_type_check'
  `);
  const definition = constraints[0]?.definition ?? '';
  const values = Array.from(definition.matchAll(/'([^']+)'/g)).map((match) => match[1]);
  if (!values.includes('ST') || !values.includes('STANDARD')) {
    throw new Error(`Target DB games_type_check does not allow canonical ST/STANDARD values: ${definition || 'missing'}`);
  }
  return { definition, values };
}

async function getRelatedConstraints() {
  return prisma.$queryRaw<Array<{ table_name: string; constraint_name: string; definition: string }>>(Prisma.sql`
    SELECT t.relname AS table_name, c.conname AS constraint_name, pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname IN ('stations', 'games', 'qr_tokens', 'team_station_progress', 'score_events', 'final_submissions', 'teams')
    ORDER BY t.relname, c.conname
  `);
}

async function assertSchemaReady() {
  const requiredColumns = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>(Prisma.sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'stations' AND column_name IN ('id', 'name', 'description', 'map_x', 'map_y', 'tracking_mode', 'is_active', 'sort_order')) OR
        (table_name = 'games' AND column_name IN ('station_id', 'type', 'max_points', 'media_url', 'is_active')) OR
        (table_name = 'qr_tokens' AND column_name IN ('station_id', 'purpose', 'token_fingerprint', 'token_hash', 'raw_token', 'schema_version', 'is_active', 'revoked_at')) OR
        (table_name = 'team_station_progress' AND column_name IN ('team_id', 'station_id', 'game_id', 'status', 'attempt_no', 'checked_in_at', 'checked_out_at', 'completed_at', 'cancelled_at', 'reopened_at', 'score_achieved')) OR
        (table_name = 'teams' AND column_name IN ('total_points', 'total_play_seconds', 'started_at', 'status', 'max_possible_points')) OR
        (table_name = 'final_submissions' AND column_name IN ('score_event_id', 'points_awarded', 'winner_rank', 'is_correct')) OR
        (table_name = 'activity_logs' AND column_name IN ('entity_type', 'entity_id', 'action', 'metadata'))
      )
  `);
  const present = new Set(requiredColumns.map((column) => `${column.table_name}.${column.column_name}`));
  for (const key of [
    'stations.id', 'stations.name', 'stations.description', 'stations.map_x', 'stations.map_y', 'stations.tracking_mode', 'stations.is_active', 'stations.sort_order',
    'games.station_id', 'games.type', 'games.max_points', 'games.media_url', 'games.is_active',
    'qr_tokens.station_id', 'qr_tokens.purpose', 'qr_tokens.token_fingerprint', 'qr_tokens.token_hash', 'qr_tokens.raw_token', 'qr_tokens.schema_version', 'qr_tokens.is_active', 'qr_tokens.revoked_at',
    'team_station_progress.team_id', 'team_station_progress.station_id', 'team_station_progress.game_id', 'team_station_progress.status', 'team_station_progress.attempt_no', 'team_station_progress.checked_in_at', 'team_station_progress.checked_out_at', 'team_station_progress.completed_at', 'team_station_progress.cancelled_at', 'team_station_progress.reopened_at', 'team_station_progress.score_achieved',
    'teams.total_points', 'teams.total_play_seconds', 'teams.started_at', 'teams.status', 'teams.max_possible_points',
    'final_submissions.score_event_id', 'final_submissions.points_awarded', 'final_submissions.winner_rank', 'final_submissions.is_correct',
    'activity_logs.entity_type', 'activity_logs.entity_id', 'activity_logs.action', 'activity_logs.metadata',
  ]) {
    if (!present.has(key)) {
      throw new Error(`Target DB schema missing required column ${key}`);
    }
  }
}

async function collectAudit() {
  const existingStations = await prisma.station.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true, name: true } });
  const existingStationIds = existingStations.map((station) => station.id);
  const existingProgressIds = await prisma.teamStationProgress.findMany({ select: { id: true } });
  const stationMetadataClauses = existingStationIds.map((stationId) => ({ metadata: { path: ['stationId'], equals: stationId } }));
  const stationIdActivityClauses = existingStationIds.map((stationId) => ({ entityId: stationId }));
  const progressIdActivityClauses = existingProgressIds.map(({ id }) => ({ entityType: 'TEAM_STATION_PROGRESS', entityId: String(id) }));
  const [
    gameCount,
    qrTokenCount,
    progressByStatus,
    touchedProgress,
    scoreEvents,
    teamCounts,
    finalCounts,
    finalChallenges,
    stationActivityLogs,
  ] = await Promise.all([
    prisma.game.count(),
    prisma.qrToken.count(),
    prisma.teamStationProgress.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.teamStationProgress.count({
      where: {
        OR: [
          { attemptNo: { gt: 0 } },
          { checkedInAt: { not: null } },
          { checkedOutAt: { not: null } },
          { completedAt: { not: null } },
          { cancelledAt: { not: null } },
          { reopenedAt: { not: null } },
          { scoreAchieved: { not: 0 } },
        ],
      },
    }),
    prisma.scoreEvent.count(),
    Promise.all([
      prisma.team.count(),
      prisma.team.count({ where: { OR: [{ totalPoints: { not: 0 } }, { totalPlaySeconds: { not: 0 } }] } }),
    ]),
    Promise.all([
      prisma.finalSubmission.count(),
      prisma.finalSubmission.count({ where: { isCorrect: true } }),
      prisma.finalSubmission.count({ where: { winnerRank: { not: null } } }),
      prisma.finalSubmission.count({ where: { pointsAwarded: { not: 0 } } }),
      prisma.finalSubmission.count({ where: { scoreEventId: { not: null } } }),
    ]),
    prisma.finalChallenge.count(),
    prisma.activityLog.count({
      where: {
        OR: [
          { entityType: 'STATION' },
          { action: { in: ['FINAL_SUBMIT_CORRECT', 'FINAL_SUBMIT_WRONG'] } },
          ...stationIdActivityClauses,
          ...stationMetadataClauses,
          ...progressIdActivityClauses,
        ],
      },
    }),
  ]);
  const realData = touchedProgress > 0 || scoreEvents > 0 || teamCounts[1] > 0;
  return {
    stationCount: existingStations.length,
    stationNames: existingStations.map((station) => `${station.id} ${station.name}`),
    gameCount,
    qrTokenCount,
    progressByStatus,
    touchedProgress,
    scoreEvents,
    teams: teamCounts[0],
    teamsWithScores: teamCounts[1],
    finalSubmissions: finalCounts[0],
    correctFinalSubmissions: finalCounts[1],
    finalWinners: finalCounts[2],
    finalPointsAwardedRows: finalCounts[3],
    finalScoreEventLinks: finalCounts[4],
    finalChallenges,
    stationActivityLogs,
    realData,
  };
}

async function verifyAfterSync(beforeFinalChallenges: number) {
  const [stations, games, qrTokens, progressRows, nonCanonicalProgressRows, scoreEvents, finalSubmissions, teams, finalChallenges, orphanCounts] = await Promise.all([
    prisma.station.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true, name: true, description: true, mapX: true, mapY: true, sortOrder: true } }),
    prisma.game.findMany({ where: { stationId: { in: CANONICAL_STATION_IDS }, isActive: true }, select: { stationId: true, type: true, maxPoints: true, mediaUrl: true } }),
    prisma.qrToken.findMany({ where: { stationId: { in: CANONICAL_STATION_IDS }, isActive: true, revokedAt: null, schemaVersion: 'SQ1' }, select: { stationId: true, purpose: true, rawToken: true } }),
    prisma.teamStationProgress.findMany({ select: { teamId: true, stationId: true, status: true } }),
    prisma.teamStationProgress.count({ where: { stationId: { notIn: CANONICAL_STATION_IDS } } }),
    prisma.scoreEvent.count(),
    prisma.finalSubmission.count(),
    prisma.team.findMany({ select: { id: true, maxPossiblePoints: true, totalPoints: true, totalPlaySeconds: true, startedAt: true, status: true } }),
    prisma.finalChallenge.count(),
    prisma.$queryRaw<Array<{ kind: string; count: bigint }>>(Prisma.sql`
      SELECT 'progress_station' AS kind, COUNT(*)::bigint AS count FROM team_station_progress p LEFT JOIN stations s ON s.id = p.station_id WHERE s.id IS NULL
      UNION ALL SELECT 'progress_game', COUNT(*)::bigint FROM team_station_progress p LEFT JOIN games g ON g.id = p.game_id WHERE g.id IS NULL
      UNION ALL SELECT 'game_station', COUNT(*)::bigint FROM games g LEFT JOIN stations s ON s.id = g.station_id WHERE s.id IS NULL
      UNION ALL SELECT 'qr_station', COUNT(*)::bigint FROM qr_tokens q LEFT JOIN stations s ON s.id = q.station_id WHERE s.id IS NULL
    `),
  ]);
  const stGames = games.filter((game) => game.type === 'ST').length;
  const standardGames = games.filter((game) => game.type === 'STANDARD').length;
  const totalMaxScore = games.reduce((sum, game) => sum + game.maxPoints, 0);
  const canonicalFieldMismatches = CANONICAL_STATIONS.filter((station) => {
    const dbStation = stations.find((item) => item.id === station.id);
    const dbGame = games.find((item) => item.stationId === station.id);
    return !dbStation || !dbGame || dbStation.name !== station.name || dbStation.description !== station.shortDescription || dbStation.mapX !== station.mapX || dbStation.mapY !== station.mapY || dbStation.sortOrder !== station.sortOrder || dbGame.type !== station.gameType || dbGame.maxPoints !== station.maxScore || dbGame.mediaUrl !== station.mediaUrl;
  });
  const teamsWithInvalidProgress = teams.filter((team) => progressRows.filter((progress) => progress.teamId === team.id && CANONICAL_STATION_IDS.includes(progress.stationId) && progress.status === 'AVAILABLE').length !== CANONICAL_STATION_COUNT);
  const failed =
    stations.length !== CANONICAL_STATION_COUNT ||
    games.length !== CANONICAL_STATION_COUNT ||
    stGames !== CANONICAL_ST_COUNT ||
    standardGames !== CANONICAL_STANDARD_COUNT ||
    qrTokens.length !== CANONICAL_QR_TOKEN_COUNT ||
    canonicalFieldMismatches.length > 0 ||
    nonCanonicalProgressRows !== 0 ||
    scoreEvents !== 0 ||
    finalSubmissions !== 0 ||
    finalChallenges !== beforeFinalChallenges ||
    teamsWithInvalidProgress.length > 0 ||
    teams.some((team) => team.maxPossiblePoints !== CANONICAL_TOTAL_MAX_SCORE || team.totalPoints !== 0 || team.totalPlaySeconds !== 0 || team.startedAt !== null || team.status !== 'ACTIVE') ||
    orphanCounts.some((row) => Number(row.count) !== 0);
  if (failed) {
    throw new Error('Post-sync verification failed');
  }
  return {
    stations: stations.map((station) => station.name),
    stationCount: stations.length,
    games: games.length,
    stGames,
    standardGames,
    totalMaxScore,
    qrTokens: qrTokens.length,
    progressRows: progressRows.length,
    nonCanonicalProgressRows,
    scoreEvents,
    finalSubmissions,
    finalChallenges,
    teams: teams.length,
    orphanCounts: orphanCounts.map((row) => ({ kind: row.kind, count: Number(row.count) })),
    canonicalFieldsVerified: CANONICAL_STATION_COUNT,
  };
}

function assertMutationAllowed(target: SafeDatabaseTarget, audit: AuditSnapshot) {
  if (target.productionLike && !confirmReplace) {
    throw new Error('Production-like Station replacement requires CONFIRM_REPLACE_ALL_PROD_STATIONS=YES');
  }
  if (!target.productionLike) {
    console.warn('Target is not detected as Production-like; destructive sync will still run only because this manual command was invoked. Review target metadata above.');
  }
  if (audit.realData && !confirmReplace) {
    throw new Error('Real Station progress/score data detected; CONFIRM_REPLACE_ALL_PROD_STATIONS=YES is required before mutation');
  }
}

async function main() {
  const target = getSafeDatabaseTarget();
  await prisma.$connect();
  await assertSchemaReady();
  const gameTypeConstraint = await getGameTypeConstraintValues();
  const constraints = await getRelatedConstraints();
  validateCanonicalStations(gameTypeConstraint.values);
  const audit = await collectAudit();

  console.log(JSON.stringify({
    mode: auditOnly ? 'audit-only' : 'sync',
    target,
    gameTypeConstraint,
    constraints,
    canonical: {
      stationCount: CANONICAL_STATION_COUNT,
      stationNames: CANONICAL_STATIONS.map((station) => `${station.id} ${station.name}`),
      stCount: CANONICAL_ST_COUNT,
      standardCount: CANONICAL_STANDARD_COUNT,
      maxPossiblePoints: CANONICAL_TOTAL_MAX_SCORE,
      stationMaxScoreSum: CANONICAL_STATIONS.reduce((sum, station) => sum + station.maxScore, 0),
      qrTokenCount: CANONICAL_QR_TOKEN_COUNT,
    },
    audit,
  }, null, 2));

  if (auditOnly) {
    return;
  }
  assertMutationAllowed(target, audit);
  await prisma.$transaction(async (tx) => {
    await replaceAllStations(tx);
  });
  const verification = await verifyAfterSync(audit.finalChallenges);
  console.log(JSON.stringify({ status: 'stations-sync-completed', verification }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

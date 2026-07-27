import 'dotenv/config';
import { Prisma, PrismaClient, TeamStatus } from '@prisma/client';
import {
  createQrTokenFingerprint,
  createSecureQrLoginToken,
} from '../src/common/qr/qr-token';
import { getCanonicalFinalChallengeSeedData } from './final-challenge-seed';
import {
  CANONICAL_QR_TOKEN_COUNT,
  CANONICAL_STATION_COUNT,
  CANONICAL_TOTAL_MAX_SCORE,
  validateCanonicalStations,
} from './station-seed-data';
import { replaceAllStations } from './station-replacement';

export const RESET_GAMEPLAY_CONFIRM_VALUE = 'RESET MOVEMENT2026 GAMEPLAY';
export const RESET_GAMEPLAY_BACKUP_VALUE = 'BACKUP_CONFIRMED';

export type ResetMode = 'dry-run' | 'execute';

export type ResetTarget = {
  nodeEnv: string;
  appEnv: string;
  host: string;
  database: string;
  productionLike: boolean;
};

export type ResetGuards = {
  confirm?: string;
  backupConfirmed?: string;
};

export type ResetGameplayPlan = {
  mode: ResetMode;
  target: ResetTarget;
  current: {
    teams: number;
    teamSessions: number;
    qrLoginTokens: number;
    stations: number;
    games: number;
    stationQrTokens: number;
    progressRows: number;
    scoreEvents: number;
    finalSubmissions: number;
    finalChallenges: number;
    activityLogs: number;
  };
  planned: {
    preservedTeams: number;
    revokedTeamSessions: number;
    rotatedTeamQrLoginTokens: number;
    stations: number;
    games: number;
    stationQrTokens: number;
    progressRows: number;
    teamMaxPossiblePoints: number;
    eventConfigRows: number;
    finalChallenges: number;
    activityLogsAfterReset: number;
  };
};

export type ExecuteResetGameplayOptions = {
  mode: ResetMode;
  target: ResetTarget;
  guards?: ResetGuards;
};

export function parseResetMode(argv = process.argv.slice(2)): ResetMode {
  if (argv.includes('--execute')) {
    return 'execute';
  }
  return 'dry-run';
}

export function getResetTarget(databaseUrl = process.env.DATABASE_URL): ResetTarget {
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

export function assertResetGuards(
  mode: ResetMode,
  target: ResetTarget,
  guards: ResetGuards = {
    confirm: process.env.RESET_GAMEPLAY_CONFIRM,
    backupConfirmed: process.env.RESET_GAMEPLAY_BACKUP_CONFIRMED,
  },
) {
  if (mode === 'dry-run') {
    return;
  }
  if (guards.confirm !== RESET_GAMEPLAY_CONFIRM_VALUE) {
    throw new Error(
      `Execute mode requires RESET_GAMEPLAY_CONFIRM="${RESET_GAMEPLAY_CONFIRM_VALUE}"`,
    );
  }
  if (target.productionLike && guards.backupConfirmed !== RESET_GAMEPLAY_BACKUP_VALUE) {
    throw new Error(
      `Production-like execute mode requires RESET_GAMEPLAY_BACKUP_CONFIRMED="${RESET_GAMEPLAY_BACKUP_VALUE}"`,
    );
  }
}

async function createUniqueQrLoginToken(tx: Prisma.TransactionClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rawToken = createSecureQrLoginToken();
    const tokenHash = createQrTokenFingerprint(rawToken);
    const existing = await tx.qrLoginToken.findUnique({ where: { tokenHash } });
    if (!existing) {
      return { rawToken, tokenHash };
    }
  }
  throw new Error('QR_LOGIN_TOKEN_GENERATION_FAILED');
}

export async function buildResetGameplayPlan(
  db: PrismaClient,
  mode: ResetMode,
  target: ResetTarget,
): Promise<ResetGameplayPlan> {
  const [
    teams,
    teamSessions,
    qrLoginTokens,
    stations,
    games,
    stationQrTokens,
    progressRows,
    scoreEvents,
    finalSubmissions,
    finalChallenges,
    activityLogs,
  ] = await Promise.all([
    db.team.count(),
    db.teamSession.count(),
    db.qrLoginToken.count(),
    db.station.count(),
    db.game.count(),
    db.qrToken.count(),
    db.teamStationProgress.count(),
    db.scoreEvent.count(),
    db.finalSubmission.count(),
    db.finalChallenge.count(),
    db.activityLog.count(),
  ]);

  return {
    mode,
    target,
    current: {
      teams,
      teamSessions,
      qrLoginTokens,
      stations,
      games,
      stationQrTokens,
      progressRows,
      scoreEvents,
      finalSubmissions,
      finalChallenges,
      activityLogs,
    },
    planned: {
      preservedTeams: teams,
      revokedTeamSessions: teamSessions,
      rotatedTeamQrLoginTokens: teams,
      stations: CANONICAL_STATION_COUNT,
      games: CANONICAL_STATION_COUNT,
      stationQrTokens: CANONICAL_QR_TOKEN_COUNT,
      progressRows: teams * CANONICAL_STATION_COUNT,
      teamMaxPossiblePoints: CANONICAL_TOTAL_MAX_SCORE,
      eventConfigRows: 1,
      finalChallenges: 1,
      activityLogsAfterReset: 0,
    },
  };
}

export async function executeResetGameplay(db: PrismaClient) {
  return executeResetGameplayWithGuards(db, {
    mode: parseResetMode(),
    target: getResetTarget(),
  });
}

export async function executeResetGameplayWithGuards(
  db: PrismaClient,
  options: ExecuteResetGameplayOptions,
) {
  assertResetGuards(options.mode, options.target, options.guards);
  validateCanonicalStations();
  return db.$transaction(async (tx) => {
    const [teams, users] = await Promise.all([
      tx.team.findMany({ select: { id: true } }),
      tx.user.findMany({ select: { id: true } }),
    ]);
    const stationResult = await replaceAllStations(tx);

    await tx.teamSession.deleteMany();
    await tx.qrLoginToken.deleteMany();
    await tx.finalChallenge.deleteMany();
    await tx.eventConfig.deleteMany();
    await tx.activityLog.deleteMany();

    await tx.team.updateMany({
      data: {
        totalPoints: 0,
        totalPlaySeconds: 0,
        maxPossiblePoints: CANONICAL_TOTAL_MAX_SCORE,
        startedAt: null,
        status: TeamStatus.ACTIVE,
        activeSessionId: null,
        loginQrHash: null,
        loginQrFingerprint: null,
      },
    });

    await tx.eventConfig.create({
      data: {
        id: 1,
        eventEndTime: '11:30',
        finalStartsAt: '11:45',
        notifyBeforeMinutes: 15,
        cancelCooldownMinutes: 5,
        timezone: 'Asia/Ho_Chi_Minh',
      },
    });

    await tx.finalChallenge.create({
      data: getCanonicalFinalChallengeSeedData(new Date()),
    });

    for (const team of teams) {
      const { rawToken, tokenHash } = await createUniqueQrLoginToken(tx);
      await tx.qrLoginToken.create({
        data: {
          teamId: team.id,
          tokenHash,
          rawToken,
          expiresAt: null,
        },
      });
    }

    await verifyResetGameplayState(tx, {
      teamIds: teams.map((team) => team.id),
      userIds: users.map((user) => user.id),
    });

    return {
      ...stationResult,
      teamSessions: 0,
      teamQrLoginTokens: teams.length,
      eventConfigRows: 1,
      finalChallenges: 1,
      activityLogs: 0,
    };
  });
}

async function verifyResetGameplayState(
  tx: Prisma.TransactionClient,
  expected: { teamIds: number[]; userIds: number[] },
) {
  const [
    teams,
    users,
    teamSessions,
    teamQrTokens,
    eventConfigs,
    finalChallenges,
    scoreEvents,
    finalSubmissions,
    activityLogs,
    progressRows,
  ] = await Promise.all([
    tx.team.findMany({
      select: {
        id: true,
        totalPoints: true,
        totalPlaySeconds: true,
        maxPossiblePoints: true,
        startedAt: true,
        status: true,
        activeSessionId: true,
      },
    }),
    tx.user.findMany({ select: { id: true } }),
    tx.teamSession.count(),
    tx.qrLoginToken.findMany({
      where: { isActive: true, revokedAt: null, consumedAt: null },
      select: { teamId: true, expiresAt: true },
    }),
    tx.eventConfig.count(),
    tx.finalChallenge.count(),
    tx.scoreEvent.count(),
    tx.finalSubmission.count(),
    tx.activityLog.count(),
    tx.teamStationProgress.count(),
  ]);

  const expectedTeamIds = [...expected.teamIds].sort((left, right) => left - right);
  const actualTeamIds = teams.map((team) => team.id).sort((left, right) => left - right);
  const expectedUserIds = [...expected.userIds].sort((left, right) => left - right);
  const actualUserIds = users.map((user) => user.id).sort((left, right) => left - right);

  if (JSON.stringify(actualTeamIds) !== JSON.stringify(expectedTeamIds)) {
    throw new Error('Reset verification failed: Team identity changed');
  }
  if (JSON.stringify(actualUserIds) !== JSON.stringify(expectedUserIds)) {
    throw new Error('Reset verification failed: User identity changed');
  }
  if (teamSessions !== 0) {
    throw new Error('Reset verification failed: old Team sessions remain');
  }
  if (scoreEvents !== 0 || finalSubmissions !== 0 || activityLogs !== 0) {
    throw new Error('Reset verification failed: old gameplay/audit rows remain');
  }
  if (eventConfigs !== 1 || finalChallenges !== 1) {
    throw new Error('Reset verification failed: canonical Event/Final state missing');
  }
  if (progressRows !== teams.length * CANONICAL_STATION_COUNT) {
    throw new Error('Reset verification failed: Team Station progress row count mismatch');
  }

  for (const team of teams) {
    if (
      team.totalPoints !== 0 ||
      team.totalPlaySeconds !== 0 ||
      team.maxPossiblePoints !== CANONICAL_TOTAL_MAX_SCORE ||
      team.startedAt !== null ||
      team.status !== TeamStatus.ACTIVE ||
      team.activeSessionId !== null
    ) {
      throw new Error(`Reset verification failed: Team ${team.id} aggregate state is not reset`);
    }

    const tokens = teamQrTokens.filter((token) => token.teamId === team.id);
    if (tokens.length !== 1 || tokens[0].expiresAt !== null) {
      throw new Error(`Reset verification failed: Team ${team.id} QR token invariant failed`);
    }
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const mode = parseResetMode();
    const target = getResetTarget();
    assertResetGuards(mode, target);
    await prisma.$connect();
    const plan = await buildResetGameplayPlan(prisma, mode, target);
    console.log(JSON.stringify(plan, null, 2));

    if (mode === 'dry-run') {
      console.log('Dry run only. Re-run with --execute and required guards to mutate the database.');
      return;
    }

    const result = await executeResetGameplayWithGuards(prisma, { mode, target });
    console.log(JSON.stringify({ status: 'reset-gameplay-completed', result }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

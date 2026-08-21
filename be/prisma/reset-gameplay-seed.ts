import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  acquireEventPreparationLock,
  EVENT_PREPARATION_CONFIRMATION,
  readEventPreparationInventory,
  resetGameplayInTransaction,
} from '../src/common/event-preparation/event-preparation-core';

export const RESET_GAMEPLAY_CONFIRM_VALUE = EVENT_PREPARATION_CONFIRMATION;
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
    preservedTeamQrLoginTokens: number;
    preservedStationQrTokens: number;
    progressRows: number;
    teamMaxPossiblePoints: number;
    eventConfigRows: number;
    activeFinalChallenges: number;
    activityLogsAfterReset: number;
    inventoryReady: boolean;
    inventoryIssues: string[];
  };
};

export type ExecuteResetGameplayOptions = {
  mode: ResetMode;
  target: ResetTarget;
  guards?: ResetGuards;
};

export function parseResetMode(argv = process.argv.slice(2)): ResetMode {
  return argv.includes('--execute') ? 'execute' : 'dry-run';
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

export async function buildResetGameplayPlan(
  db: PrismaClient,
  mode: ResetMode,
  target: ResetTarget,
): Promise<ResetGameplayPlan> {
  const [
    teamSessions,
    qrLoginTokens,
    progressRows,
    scoreEvents,
    finalSubmissions,
    activityLogs,
    finalChallenges,
    inventory,
  ] = await Promise.all([
    db.teamSession.count(),
    db.qrLoginToken.count(),
    db.teamStationProgress.count(),
    db.scoreEvent.count(),
    db.finalSubmission.count(),
    db.activityLog.count(),
    db.finalChallenge.count(),
    readEventPreparationInventory(db),
  ]);

  return {
    mode,
    target,
    current: {
      teams: inventory.teams,
      teamSessions,
      qrLoginTokens,
      stations: inventory.activeStations,
      games: inventory.activeGames,
      stationQrTokens: inventory.activeStationQrTokens,
      progressRows,
      scoreEvents,
      finalSubmissions,
      finalChallenges,
      activityLogs,
    },
    planned: {
      preservedTeams: inventory.teams,
      preservedTeamQrLoginTokens: inventory.activeTeamQrTokens,
      preservedStationQrTokens: inventory.activeStationQrTokens,
      progressRows: inventory.teams * inventory.activeGames,
      teamMaxPossiblePoints: 1785,
      eventConfigRows: inventory.eventConfigRows,
      activeFinalChallenges: inventory.activeFinalChallenges,
      activityLogsAfterReset: 0,
      inventoryReady: inventory.ready,
      inventoryIssues: inventory.issues,
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
  if (options.mode !== 'execute') {
    throw new Error('Reset execution requires --execute');
  }
  return db.$transaction(
    async (tx) => {
      await acquireEventPreparationLock(tx);
      return resetGameplayInTransaction(tx);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
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

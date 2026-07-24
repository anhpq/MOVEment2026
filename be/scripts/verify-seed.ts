import 'dotenv/config';
import {PrismaClient, QrPurpose} from '@prisma/client';
import {
  CANONICAL_QR_TOKEN_COUNT,
  CANONICAL_STATION_COUNT,
  CANONICAL_STATION_IDS,
  CANONICAL_TOTAL_MAX_SCORE,
  CANONICAL_STANDARD_COUNT,
  CANONICAL_ST_COUNT,
} from '../prisma/station-seed-data';

const prisma = new PrismaClient();

type Check = {
  name: string;
  actual: number;
  expected: number;
};

function assertAtLeast({name, actual, expected}: Check) {
  if (actual < expected) {
    throw new Error(`${name} expected at least ${expected}, found ${actual}`);
  }
}

function assertExact({name, actual, expected}: Check) {
  if (actual !== expected) {
    throw new Error(`${name} expected exactly ${expected}, found ${actual}`);
  }
}

async function main() {
  const [
    adminUsers,
    activeStations,
    activeCanonicalStations,
    nonCanonicalStations,
    activeGames,
    teams,
    activeSq1StationQrTokens,
    activeQrLoginTokens,
    progressRows,
    nonCanonicalProgressRows,
    eventConfig,
    activeFinalChallenges,
  ] = await Promise.all([
    prisma.user.count({where: {username: 'admin', role: 'ADMIN'}}),
    prisma.station.count({where: {isActive: true}}),
    prisma.station.count({where: {id: {in: CANONICAL_STATION_IDS}, isActive: true}}),
    prisma.station.count({where: {id: {notIn: CANONICAL_STATION_IDS}}}),
    prisma.game.findMany({
      where: {stationId: {in: CANONICAL_STATION_IDS}, isActive: true},
      select: {type: true, maxPoints: true},
    }),
    prisma.team.count(),
    prisma.qrToken.count({
      where: {
        stationId: {in: CANONICAL_STATION_IDS},
        isActive: true,
        revokedAt: null,
        schemaVersion: 'SQ1',
        tokenFingerprint: {not: null},
        rawToken: {not: null},
        OR: [{expiresAt: null}, {expiresAt: {gt: new Date()}}],
      },
    }),
    prisma.qrLoginToken.count({
      where: {
        isActive: true,
        revokedAt: null,
        expiresAt: {gt: new Date()},
      },
    }),
    prisma.teamStationProgress.count({where: {stationId: {in: CANONICAL_STATION_IDS}}}),
    prisma.teamStationProgress.count({where: {stationId: {notIn: CANONICAL_STATION_IDS}}}),
    prisma.eventConfig.count({where: {id: 1}}),
    prisma.finalChallenge.count({where: {isActive: true}}),
  ]);

  assertAtLeast({name: 'admin users', actual: adminUsers, expected: 1});
  assertAtLeast({name: 'teams', actual: teams, expected: 25});
  assertExact({name: 'active stations', actual: activeStations, expected: CANONICAL_STATION_COUNT});
  assertExact({name: 'active canonical stations', actual: activeCanonicalStations, expected: CANONICAL_STATION_COUNT});
  assertExact({name: 'non-canonical stations', actual: nonCanonicalStations, expected: 0});
  assertExact({name: 'active canonical games', actual: activeGames.length, expected: CANONICAL_STATION_COUNT});
  assertExact({
    name: 'canonical ST games',
    actual: activeGames.filter((game) => game.type === 'ST').length,
    expected: CANONICAL_ST_COUNT,
  });
  assertExact({
    name: 'canonical STANDARD games',
    actual: activeGames.filter((game) => game.type === 'STANDARD').length,
    expected: CANONICAL_STANDARD_COUNT,
  });
  assertExact({
    name: 'seed-managed team max possible points',
    actual: await prisma.team.count({where: {maxPossiblePoints: CANONICAL_TOTAL_MAX_SCORE}}),
    expected: teams,
  });
  assertExact({
    name: 'active SQ1 station QR tokens',
    actual: activeSq1StationQrTokens,
    expected: CANONICAL_QR_TOKEN_COUNT,
  });
  const activeStationsWithQrPair = await prisma.station.count({
    where: {
      id: {in: CANONICAL_STATION_IDS},
      isActive: true,
      AND: [
        {
          qrTokens: {
            some: {
              purpose: QrPurpose.CHECK_IN,
              isActive: true,
              revokedAt: null,
              schemaVersion: 'SQ1',
              OR: [{expiresAt: null}, {expiresAt: {gt: new Date()}}],
            },
          },
        },
        {
          qrTokens: {
            some: {
              purpose: QrPurpose.CHECK_OUT,
              isActive: true,
              revokedAt: null,
              schemaVersion: 'SQ1',
              OR: [{expiresAt: null}, {expiresAt: {gt: new Date()}}],
            },
          },
        },
      ],
    },
  });
  assertExact({
    name: 'active stations with SQ1 QR pair',
    actual: activeStationsWithQrPair,
    expected: CANONICAL_STATION_COUNT,
  });
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_QR_LOGIN_TOKENS !== 'false') {
    assertAtLeast({
      name: 'active QR login tokens',
      actual: activeQrLoginTokens,
      expected: teams,
    });
  }
  assertExact({
    name: 'team station progress rows',
    actual: progressRows,
    expected: teams * CANONICAL_STATION_COUNT,
  });
  assertExact({name: 'non-canonical progress rows', actual: nonCanonicalProgressRows, expected: 0});
  assertAtLeast({name: 'event config rows', actual: eventConfig, expected: 1});
  assertAtLeast({
    name: 'active final challenges',
    actual: activeFinalChallenges,
    expected: 1,
  });

  console.log(
    [
      'Seed verification passed:',
      `${teams} teams`,
      `${activeStations} active canonical stations`,
      `${progressRows} progress rows`,
      `${activeSq1StationQrTokens} active SQ1 station QR tokens`,
      `${activeQrLoginTokens} active QR login tokens`,
    ].join(' '),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

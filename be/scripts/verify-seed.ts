import 'dotenv/config';
import {PrismaClient, QrPurpose} from '@prisma/client';

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
    teams,
    activeSq1StationQrTokens,
    activeQrLoginTokens,
    progressRows,
    eventConfig,
    activeFinalChallenges,
  ] = await Promise.all([
    prisma.user.count({where: {username: 'admin', role: 'ADMIN'}}),
    prisma.station.count({where: {isActive: true}}),
    prisma.team.count(),
    prisma.qrToken.count({
      where: {
        isActive: true,
        revokedAt: null,
        schemaVersion: 'SQ1',
        tokenFingerprint: {not: null},
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
    prisma.teamStationProgress.count(),
    prisma.eventConfig.count({where: {id: 1}}),
    prisma.finalChallenge.count({where: {isActive: true}}),
  ]);

  assertAtLeast({name: 'admin users', actual: adminUsers, expected: 1});
  assertAtLeast({name: 'teams', actual: teams, expected: 25});
  assertAtLeast({name: 'active stations', actual: activeStations, expected: 10});
  assertExact({
    name: 'active SQ1 station QR tokens',
    actual: activeSq1StationQrTokens,
    expected: activeStations * 2,
  });
  const activeStationsWithQrPair = await prisma.station.count({
    where: {
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
  assertAtLeast({
    name: 'active stations with SQ1 QR pair',
    actual: activeStationsWithQrPair,
    expected: activeStations,
  });
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_QR_LOGIN_TOKENS !== 'false') {
    assertAtLeast({
      name: 'active QR login tokens',
      actual: activeQrLoginTokens,
      expected: teams,
    });
  }
  assertAtLeast({
    name: 'team station progress rows',
    actual: progressRows,
    expected: teams * activeStations,
  });
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
      `${activeStations} active stations`,
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

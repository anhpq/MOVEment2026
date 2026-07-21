import 'dotenv/config';
import {PrismaClient} from '@prisma/client';

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

async function main() {
  const [
    adminUsers,
    activeStations,
    teams,
    teamLoginQrFingerprints,
    stationQrFingerprints,
    activeQrLoginTokens,
    progressRows,
    eventConfig,
    activeFinalChallenges,
  ] = await Promise.all([
    prisma.user.count({where: {username: 'admin', role: 'ADMIN'}}),
    prisma.station.count({where: {isActive: true}}),
    prisma.team.count(),
    prisma.team.count({where: {loginQrFingerprint: {not: null}}}),
    prisma.qrToken.count({where: {tokenFingerprint: {not: null}}}),
    prisma.qrLoginToken.count({
      where: {
        consumedAt: null,
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
  assertAtLeast({
    name: 'team login QR fingerprints',
    actual: teamLoginQrFingerprints,
    expected: 25,
  });
  assertAtLeast({
    name: 'station QR fingerprints',
    actual: stationQrFingerprints,
    expected: activeStations * 2,
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
      `${stationQrFingerprints} station QR fingerprints`,
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

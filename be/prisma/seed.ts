import 'dotenv/config';
import {
  PrismaClient,
  ProgressStatus,
  QrPurpose,
  StationTrackingMode,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  buildQrLoginUrl,
  createSecureStationQrToken,
  createSecureQrLoginToken,
  createQrTokenFingerprint,
} from '../src/common/qr/qr-token';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { FINAL_CHALLENGE_SEED_KEY, planFinalChallengeSeed } from './final-challenge-seed';

const prisma = new PrismaClient();
const seedStartedAt = Date.now();
const isProduction = process.env.NODE_ENV === 'production';
const seedQrLoginTokens = !isProduction && process.env.SEED_QR_LOGIN_TOKENS !== 'false';
const frontendPublicUrl =
  process.env.FRONTEND_PUBLIC_URL ??
  process.env.PUBLIC_FRONTEND_URL ??
  'http://localhost:4173';
const qrLoginTokenTtlMinutes = Number.parseInt(
  process.env.QR_LOGIN_TOKEN_TTL_MINUTES ?? '',
  10,
);
const safeQrLoginTokenTtlMinutes =
  Number.isInteger(qrLoginTokenTtlMinutes) && qrLoginTokenTtlMinutes > 0
    ? qrLoginTokenTtlMinutes
    : 24 * 60;
const devQrArtifactPath = resolve(
  process.cwd(),
  '..',
  '.tester-logs',
  'dev-qr-login-urls.txt',
);
const devStationQrArtifactPath = resolve(
  process.cwd(),
  '..',
  '.tester-logs',
  'dev-station-qr-tokens.txt',
);

const stations = [
  ['ST002', 'Tram #2', 'CIPHER', 100, 18, 35],
  ['ST047', 'Tram #47', 'ST', 120, 25, 85],
  ['ST017', 'Tram #17', 'CIPHER', 110, 65, 22],
  ['ST15A', 'Tram #15A', 'STANDARD', 130, 82, 12],
  ['ST029', 'Tram #29', 'STANDARD', 150, 88, 42],
  ['ST003', 'Tram Sang Tao', 'ST', 140, 42, 48],
  ['ST004', 'Tram Am Nhac', 'ST', 120, 55, 65],
  ['ST005', 'Tram Khoi Phuc', 'CIPHER', 100, 75, 72],
  ['ST006', 'Tram Khach', 'STANDARD', 110, 48, 38],
  ['ST010', 'Tram Tuyet Ky', 'ST', 200, 92, 60],
] as const;

const teamColors = [
  '#FF6B6B',
  '#FFA500',
  '#228B22',
  '#1677FF',
  '#722ED1',
  '#13C2C2',
  '#EB2F96',
  '#52C41A',
  '#FAAD14',
  '#2F54EB',
] as const;

const teams = Array.from({ length: 25 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    name: `Team ${number}`,
    username: `team${number}`,
    captainName: `Captain ${number}`,
    password: `team${number}`,
    color: teamColors[index % teamColors.length],
  };
});

function formatDuration(startedAt: number) {
  return `${Date.now() - startedAt}ms`;
}

function logSeed(message: string) {
  console.log(`[seed +${formatDuration(seedStartedAt)}] ${message}`);
}

async function runSeedPhase<T>(name: string, action: () => Promise<T>) {
  const startedAt = Date.now();
  logSeed(`Starting ${name}...`);
  try {
    const result = await action();
    logSeed(`Finished ${name} in ${formatDuration(startedAt)}.`);
    return result;
  } catch (error) {
    logSeed(`Failed ${name} after ${formatDuration(startedAt)}.`);
    throw error;
  }
}

async function main() {
  logSeed('Seed script started.');
  const generatedDevQrUrls: string[] = [];
  const generatedDevStationQrTokens: string[] = [];
  let generatedStationQrRepairCount = 0;

  await runSeedPhase('database connection', async () => {
    await prisma.$connect();
  });

  const adminPassword = await bcrypt.hash('admin123', 10);
  await runSeedPhase('admin account', async () => {
    await prisma.user.upsert({
      where: { username: 'admin' },
      create: {
        username: 'admin',
        passwordHash: adminPassword,
        role: UserRole.ADMIN,
      },
      update: {},
    });
  });

  await runSeedPhase('seed stations', async () => {
    for (let index = 0; index < stations.length; index += 1) {
      const [id, name, , , mapX, mapY] = stations[index];
      await prisma.station.upsert({
        where: { id },
        create: {
          id,
          name,
          description: `${name} station`,
          mapX,
          mapY,
          trackingMode: StationTrackingMode.BOTH,
          sortOrder: index + 1,
        },
        update: { name, mapX, mapY, sortOrder: index + 1 },
      });
    }
  });

  await runSeedPhase('seed challenges', async () => {
    for (let index = 0; index < stations.length; index += 1) {
      const [id, name, type, maxPoints] = stations[index];
      const game = await prisma.game.findFirst({ where: { stationId: id } });
      if (!game) {
        await prisma.game.create({
          data: {
            stationId: id,
            title: `${name} Game`,
            type,
            difficulty: Math.min(5, (index % 5) + 1),
            maxPoints,
            clueText: `Guide for ${name}`,
            mediaUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            answerHash:
              type === 'CIPHER' ? await bcrypt.hash(`answer-${id.toLowerCase()}`, 10) : null,
          },
        });
      }
    }
  });

  await runSeedPhase('station QR token repair', async () => {
    for (const [id, name] of stations) {
      for (const purpose of [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT]) {
        const generated = await ensureStationQrToken(id, name, purpose);
        if (generated) {
          generatedStationQrRepairCount += 1;
          if (generated.artifactEntry) {
            generatedDevStationQrTokens.push(generated.artifactEntry);
          }
        }
      }
    }
  });

  const totalMaxPoints = stations.reduce((sum, item) => sum + item[3], 0);
  await runSeedPhase('seed teams', async () => {
    for (const { name, username, captainName, password, color } of teams) {
      const passwordHash = await bcrypt.hash(password, 10);
      const team = await prisma.team.upsert({
        where: { username },
        create: {
          name,
          username,
          captainName,
          passwordHash,
          startedAt: new Date(),
          color,
          maxPossiblePoints: totalMaxPoints,
        },
        update: {
          name,
          captainName,
          passwordHash,
          color,
          maxPossiblePoints: totalMaxPoints,
        },
      });

      for (const [stationId] of stations) {
        const game = await prisma.game.findFirstOrThrow({ where: { stationId } });
        await prisma.teamStationProgress.upsert({
          where: { teamId_stationId: { teamId: team.id, stationId } },
          create: {
            teamId: team.id,
            stationId,
            gameId: game.id,
            status: ProgressStatus.AVAILABLE,
          },
          update: {},
        });
      }

      if (seedQrLoginTokens) {
        const activeQrLoginToken = await prisma.qrLoginToken.findFirst({
          where: {
            teamId: team.id,
            isActive: true,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        });

        if (!activeQrLoginToken?.rawToken) {
          const rawToken = createSecureQrLoginToken();
          const expiresAt = new Date(
            Date.now() + safeQrLoginTokenTtlMinutes * 60_000,
          );
          await prisma.$transaction(async (tx) => {
            await tx.qrLoginToken.updateMany({
              where: { teamId: team.id, isActive: true },
              data: { isActive: false },
            });
            await tx.qrLoginToken.create({
              data: {
                teamId: team.id,
                tokenHash: createQrTokenFingerprint(rawToken),
                rawToken,
                expiresAt,
              },
            });
          });
          generatedDevQrUrls.push(
            [
              `Team: ${team.name}`,
              `Username: ${team.username}`,
              `Status: ACTIVE`,
              `ExpiresAt: ${expiresAt.toISOString()}`,
              `QrLoginUrl: ${buildQrLoginUrl(frontendPublicUrl, rawToken)}`,
            ].join('\n'),
          );
        }
      }
    }
  });

  await runSeedPhase('event config', async () => {
    await prisma.eventConfig.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
  });

  await runSeedPhase('seed final event', async () => {
    const final = await prisma.finalChallenge.findFirst({
      where: { title: FINAL_CHALLENGE_SEED_KEY },
    });
    const finalSeedAction = planFinalChallengeSeed({
      existing: final,
      environment: isProduction ? 'production' : 'non-production',
      now: new Date(),
    });
    if (finalSeedAction.operation === 'create') {
      await prisma.finalChallenge.create({ data: finalSeedAction.data });
    } else if (finalSeedAction.operation === 'update') {
      await prisma.finalChallenge.update({
        where: { id: finalSeedAction.id },
        data: finalSeedAction.data,
      });
    }
    logSeed(`Final Challenge seed action: ${finalSeedAction.operation}.`);
  });

  if (generatedDevQrUrls.length) {
    mkdirSync(dirname(devQrArtifactPath), { recursive: true });
    writeFileSync(
      devQrArtifactPath,
      [
        'MOVEment 2026 development-only QR login URLs',
        'Do not commit this file. Do not use these tokens in production.',
        `GeneratedAt: ${new Date().toISOString()}`,
        `FrontendPublicUrl: ${frontendPublicUrl}`,
        '',
        generatedDevQrUrls.join('\n\n---\n\n'),
        '',
      ].join('\n'),
      'utf8',
    );
    console.log(
      `Development QR login URLs written to ${devQrArtifactPath}. Do not commit this file.`,
    );
  } else if (seedQrLoginTokens) {
    console.log(
      'Development QR login tokens already exist; seed preserved them and did not rotate printed QR codes.',
    );
  }

  if (!isProduction && generatedDevStationQrTokens.length) {
    mkdirSync(dirname(devStationQrArtifactPath), { recursive: true });
    writeFileSync(
      devStationQrArtifactPath,
      [
        'MOVEment 2026 development-only Station QR tokens',
        'Do not commit this file. Rotate the affected purpose to reprint later.',
        `GeneratedAt: ${new Date().toISOString()}`,
        '',
        generatedDevStationQrTokens.join('\n\n---\n\n'),
        '',
      ].join('\n'),
      'utf8',
    );
    console.log(
      `Development Station QR tokens written to ${devStationQrArtifactPath}. Do not commit this file.`,
    );
  } else {
    console.log(
      generatedStationQrRepairCount
        ? `Repaired ${generatedStationQrRepairCount} Station QR token(s); raw tokens were not printed in production mode.`
        : 'Station QR tokens already contain active SQ1 pairs; seed preserved them and did not rotate printed QR codes.',
    );
  }

  logSeed('Seed completed.');
}

async function ensureStationQrToken(
  stationId: string,
  stationName: string,
  purpose: QrPurpose,
) {
  const activeSq1Token = await prisma.qrToken.findFirst({
    where: {
      stationId,
      purpose,
      isActive: true,
      revokedAt: null,
      schemaVersion: 'SQ1',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (activeSq1Token?.rawToken) {
    return null;
  }

  const rawToken = await createUniqueStationQrToken(purpose);
  await prisma.$transaction(async (tx) => {
    await tx.qrToken.updateMany({
      where: { stationId, purpose, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });
    await tx.qrToken.create({
      data: {
        stationId,
        purpose,
        schemaVersion: 'SQ1',
        tokenHash: await bcrypt.hash(rawToken, 10),
        tokenFingerprint: createQrTokenFingerprint(rawToken),
        rawToken,
      },
    });
  });

  if (isProduction) {
    return { artifactEntry: null };
  }

  return {
    artifactEntry: [
      `Station: ${stationName}`,
      `StationId: ${stationId}`,
      `Purpose: ${purpose}`,
      `Status: ACTIVE`,
      `QrToken: ${rawToken}`,
    ].join('\n'),
  };
}

async function createUniqueStationQrToken(purpose: QrPurpose) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rawToken = createSecureStationQrToken(purpose);
    const existing = await prisma.qrToken.findUnique({
      where: { tokenFingerprint: createQrTokenFingerprint(rawToken) },
    });
    if (!existing) {
      return rawToken;
    }
  }

  throw new Error('STATION_QR_TOKEN_GENERATION_FAILED');
}

main()
  .then(async () => {
    logSeed('Disconnecting Prisma...');
    await prisma.$disconnect();
    logSeed('Prisma disconnected.');
    console.log('Seed completed successfully.');
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    logSeed('Disconnecting Prisma after failure...');
    await prisma.$disconnect();
    logSeed('Prisma disconnected after failure.');
    process.exitCode = 1;
  });

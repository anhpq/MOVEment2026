import 'dotenv/config';
import { PrismaClient, ProgressStatus, QrPurpose, UserRole } from '@prisma/client';
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
import {
  buildSeedTeams,
  buildTeamSeedUpdateData,
  planTeamSeedOperation,
  validateTeamColorPalette,
  TEAM_COLOR_PALETTE,
} from './team-color-seed';
import {
  CANONICAL_STATIONS,
  CANONICAL_STATION_IDS,
  CANONICAL_TOTAL_MAX_SCORE,
  canonicalStationSignature,
  canonicalStationSignatureInput,
  validateCanonicalStations,
} from './station-seed-data';
import { replaceAllStations } from './station-replacement';

const prisma = new PrismaClient();
const seedStartedAt = Date.now();
const isProduction = process.env.NODE_ENV === 'production';
const allowProductionStationReplacement = process.env.CONFIRM_REPLACE_ALL_PROD_STATIONS === 'YES';
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

const teams = buildSeedTeams();

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
  validateTeamColorPalette(TEAM_COLOR_PALETTE);
  validateCanonicalStations();
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

  const stationInventoryMatches = await runSeedPhase('canonical Station inventory check', async () => {
    const existingStations = await prisma.station.findMany({
      include: { games: true },
      orderBy: { id: 'asc' },
    });
    if (!existingStations.length) {
      return false;
    }
    return canonicalStationSignatureInput(existingStations) === canonicalStationSignature();
  });

  if (!stationInventoryMatches) {
    await runSeedPhase('canonical Station replacement', async () => {
      if (isProduction && !allowProductionStationReplacement) {
        const currentStationCount = await prisma.station.count();
        if (currentStationCount > 0) {
          throw new Error('Production Station inventory is not canonical. Run `npm --prefix be run stations:sync -- --audit-only`, review target metadata, then rerun with CONFIRM_REPLACE_ALL_PROD_STATIONS=YES.');
        }
      }
      await prisma.$transaction(async (tx) => {
        const currentStationCount = await tx.station.count();
        if (isProduction && currentStationCount === 0) {
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
            await tx.game.create({
              data: {
                stationId: station.id,
                title: `${station.name} Game`,
                type: station.gameType,
                maxPoints: station.maxScore,
                mediaUrl: station.mediaUrl,
                isActive: true,
              },
            });
          }
        } else {
          await replaceAllStations(tx);
        }
      });
    });
  } else {
    await runSeedPhase('seed canonical stations', async () => {
      for (const station of CANONICAL_STATIONS) {
        await prisma.station.upsert({
          where: { id: station.id },
          create: {
            id: station.id,
            name: station.name,
            description: station.shortDescription,
            mapX: station.mapX,
            mapY: station.mapY,
            trackingMode: 'BOTH',
            isActive: true,
            sortOrder: station.sortOrder,
          },
          update: {
            name: station.name,
            description: station.shortDescription,
            mapX: station.mapX,
            mapY: station.mapY,
            isActive: true,
            sortOrder: station.sortOrder,
          },
        });
      }
    });

    await runSeedPhase('seed canonical games', async () => {
      for (const station of CANONICAL_STATIONS) {
        const game = await prisma.game.findFirst({ where: { stationId: station.id, isActive: true } });
        if (!game) {
          await prisma.game.create({
            data: {
              stationId: station.id,
              title: `${station.name} Game`,
              type: station.gameType,
              maxPoints: station.maxScore,
              mediaUrl: station.mediaUrl,
            },
          });
        } else {
          await prisma.game.update({
            where: { id: game.id },
            data: {
              title: `${station.name} Game`,
              type: station.gameType,
              maxPoints: station.maxScore,
              mediaUrl: station.mediaUrl,
            },
          });
        }
      }
    });
  }

  await runSeedPhase('station QR token repair', async () => {
    for (const station of CANONICAL_STATIONS) {
      for (const purpose of [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT]) {
        const generated = await ensureStationQrToken(station.id, station.name, purpose);
        if (generated) {
          generatedStationQrRepairCount += 1;
          if (generated.artifactEntry) {
            generatedDevStationQrTokens.push(generated.artifactEntry);
          }
        }
      }
    }
  });

  await runSeedPhase('seed teams', async () => {
    for (const { name, username, captainName, password, color } of teams) {
      const existingTeam = isProduction
        ? await prisma.team.findUnique({ where: { username } })
        : null;
      const operation = planTeamSeedOperation({
        isProduction,
        username,
        exists: Boolean(existingTeam),
      });
      if (operation === 'skip') {
        continue;
      }

      const team =
        operation === 'update-color'
          ? await prisma.team.update({
              where: { username },
              data: { color },
            })
          : await upsertNonProductionSeedTeam({
              name,
              username,
              captainName,
              password,
              color,
              totalMaxPoints: CANONICAL_TOTAL_MAX_SCORE,
            });

      if (!isProduction) {
        for (const station of CANONICAL_STATIONS) {
          const game = await prisma.game.findFirstOrThrow({ where: { stationId: station.id, isActive: true } });
          await prisma.teamStationProgress.upsert({
            where: { teamId_stationId: { teamId: team.id, stationId: station.id } },
            create: {
              teamId: team.id,
              stationId: station.id,
              gameId: game.id,
              status: ProgressStatus.AVAILABLE,
            },
            update: { gameId: game.id },
          });
        }
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

  await runSeedPhase('remove non-canonical progress rows', async () => {
    if (!isProduction) {
      await prisma.teamStationProgress.deleteMany({
        where: { stationId: { notIn: CANONICAL_STATION_IDS } },
      });
      await prisma.team.updateMany({
        data: { maxPossiblePoints: CANONICAL_TOTAL_MAX_SCORE },
      });
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

async function upsertNonProductionSeedTeam(params: {
  name: string;
  username: string;
  captainName: string;
  password: string;
  color: string;
  totalMaxPoints: number;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);
  return prisma.team.upsert({
    where: { username: params.username },
    create: {
      name: params.name,
      username: params.username,
      captainName: params.captainName,
      passwordHash,
      startedAt: null,
      color: params.color,
      maxPossiblePoints: params.totalMaxPoints,
    },
    update: buildTeamSeedUpdateData({
      isProduction: false,
      name: params.name,
      captainName: params.captainName,
      passwordHash,
      color: params.color,
      totalMaxPoints: params.totalMaxPoints,
    }),
  });
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

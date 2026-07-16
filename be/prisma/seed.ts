import 'dotenv/config';
import { PrismaClient, ProgressStatus, QrPurpose, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const stations = [
  ['ST002', 'Tram #2', 'CIPHER', 100, 18, 35],
  ['ST047', 'Tram #47', 'PUZZLE', 120, 25, 85],
  ['ST017', 'Tram #17', 'CIPHER', 110, 65, 22],
  ['ST15A', 'Tram #15A', 'QUIZ', 130, 82, 12],
  ['ST029', 'Tram #29', 'PHYSICAL', 150, 88, 42],
  ['ST003', 'Tram Sang Tao', 'CREATIVE', 140, 42, 48],
  ['ST004', 'Tram Am Nhac', 'MUSIC', 120, 55, 65],
  ['ST005', 'Tram Khoi Phuc', 'CIPHER', 100, 75, 72],
  ['ST006', 'Tram Khach', 'QUIZ', 110, 48, 38],
  ['ST010', 'Tram Tuyet Ky', 'FINAL', 200, 92, 60],
] as const;

const teams = [
  ['Dragon Squad', 'dragon', 'An', 'dragon123', '#FF6B6B'],
  ['Phoenix Rising', 'phoenix', 'Binh', 'phoenix123', '#FFA500'],
  ['Savage Hunters', 'savage', 'Chi', 'savage123', '#228B22'],
] as const;

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const scoringCodeHash = await bcrypt.hash(process.env.SCORING_CODE ?? '2468', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
    update: {},
  });

  for (let index = 0; index < stations.length; index += 1) {
    const [id, name, type, maxPoints, mapX, mapY] = stations[index];
    await prisma.station.upsert({
      where: { id },
      create: {
        id,
        name,
        description: `${name} station`,
        mapX,
        mapY,
        sortOrder: index + 1,
      },
      update: { name, mapX, mapY, sortOrder: index + 1 },
    });
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
    for (const purpose of [QrPurpose.CHECK_IN, QrPurpose.CHECK_OUT]) {
      const existing = await prisma.qrToken.findFirst({
        where: { stationId: id, purpose },
      });
      if (!existing) {
        await prisma.qrToken.create({
          data: {
            stationId: id,
            purpose,
            tokenHash: await bcrypt.hash(`${id}-${purpose}`, 10),
          },
        });
      }
    }
  }

  const totalMaxPoints = stations.reduce((sum, item) => sum + item[3], 0);
  for (const [name, username, captainName, password, color] of teams) {
    const team = await prisma.team.upsert({
      where: { username },
      create: {
        name,
        username,
        captainName,
        passwordHash: await bcrypt.hash(password, 10),
        startedAt: new Date(),
        color,
        maxPossiblePoints: totalMaxPoints,
      },
      update: {
        name,
        captainName,
        passwordHash: await bcrypt.hash(password, 10),
        color,
        maxPossiblePoints: totalMaxPoints,
      },
    });

    for (let index = 0; index < stations.length; index += 1) {
      const stationId = stations[index][0];
      const game = await prisma.game.findFirstOrThrow({ where: { stationId } });
      await prisma.teamStationProgress.upsert({
        where: { teamId_stationId: { teamId: team.id, stationId } },
        create: {
          teamId: team.id,
          stationId,
          gameId: game.id,
          status: index < 2 ? ProgressStatus.AVAILABLE : ProgressStatus.LOCKED,
        },
        update: {},
      });
    }
  }

  await prisma.eventConfig.upsert({
    where: { id: 1 },
    create: { id: 1, scoringCodeHash },
    update: { scoringCodeHash },
  });

  const final = await prisma.finalChallenge.findFirst({ where: { isActive: true } });
  if (!final) {
    const startsAt = new Date();
    startsAt.setHours(11, 45, 0, 0);
    await prisma.finalChallenge.create({
      data: {
        title: 'Final Cipher',
        clueText: 'Giai mat thu cuoi cung',
        answerHash: await bcrypt.hash('movement2026', 10),
        startsAt,
        maxWinners: 10,
        pointsByRank: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

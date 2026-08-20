import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ActorType, Prisma, ProgressStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventConfigService } from './event-config.service';

const FINAL_LIFECYCLE_ADVISORY_LOCK = 2026081909;

@Injectable()
export class EventLifecycleService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventConfig: EventConfigService,
  ) {}

  onModuleInit() {
    void this.reconcileFinalStart();
    this.timer = setInterval(() => void this.reconcileFinalStart(), 5_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async reconcileFinalStart(now = new Date()) {
    if (!(await this.eventConfig.isPastFinalStart(now))) return 0;

    return this.prisma.$transaction(async (tx) => {
      await this.acquireFinalLifecycleLock(tx);
      const activeAttempts = await tx.teamStationProgress.findMany({
        where: {
          status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] },
          checkedOutAt: null,
          completedAt: null,
        },
        select: { id: true, teamId: true, stationId: true },
      });
      let cancelled = 0;
      for (const progress of activeAttempts) {
        const claim = await tx.teamStationProgress.updateMany({
          where: {
            id: progress.id,
            checkedOutAt: null,
            completedAt: null,
            status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] },
          },
          data: {
            status: ProgressStatus.AVAILABLE,
            checkedInAt: null,
            checkedOutAt: null,
            completedAt: null,
            cancelledAt: now,
            nextCheckInAllowedAt: null,
            scoreAchieved: 0,
            scoreEnteredByUserId: null,
          },
        });
        if (!claim.count) continue;
        cancelled += 1;
        await tx.activityLog.create({
          data: {
            actorType: ActorType.SYSTEM,
            actorId: 'final-lifecycle',
            action: 'FINAL_STARTED_CANCEL_STATION',
            entityType: 'TEAM_STATION_PROGRESS',
            entityId: String(progress.id),
            metadata: { teamId: progress.teamId, stationId: progress.stationId },
          },
        });
      }

      await this.finalizeBaTieu(tx, now);
      return cancelled;
    });
  }

  async isCheckoutBeforeFinalStart(
    tx: Prisma.TransactionClient,
    now?: Date,
  ) {
    await this.acquireFinalLifecycleLock(tx);
    return !(await this.eventConfig.isPastFinalStart(now ?? new Date()));
  }

  private async acquireFinalLifecycleLock(tx: Prisma.TransactionClient) {
    await tx.$executeRawUnsafe(
      'SELECT pg_advisory_xact_lock($1)',
      FINAL_LIFECYCLE_ADVISORY_LOCK,
    );
  }

  private async finalizeBaTieu(tx: Prisma.TransactionClient, now: Date) {
    const legacyPending = await tx.teamStationProgress.findMany({
      where: {
        stationId: 'ST009',
        checkedInAt: { not: null },
        checkedOutAt: { not: null },
        completedAt: null,
      },
      include: { team: { select: { totalPoints: true } } },
    });
    for (const progress of legacyPending) {
      const claim = await tx.teamStationProgress.updateMany({
        where: { id: progress.id, completedAt: null },
        data: {
          status: ProgressStatus.COMPLETED,
          completedAt: progress.checkedOutAt,
          scoreAchieved: 10,
          scoreEnteredByUserId: null,
        },
      });
      if (!claim.count) continue;
      await tx.team.update({
        where: { id: progress.teamId },
        data: { totalPoints: { increment: 10 } },
      });
      await tx.scoreEvent.create({
        data: {
          teamId: progress.teamId,
          progressId: progress.id,
          stationId: 'ST009',
          scoreBefore: progress.team.totalPoints,
          scoreAfter: progress.team.totalPoints + 10,
          delta: 10,
          reason: 'ST009_PROVISIONAL_NORMALIZATION',
        },
      });
    }

    const unrankedCompleted = await tx.teamStationProgress.findMany({
      where: {
        stationId: 'ST009',
        status: ProgressStatus.COMPLETED,
        checkedInAt: { not: null },
        checkedOutAt: { not: null },
        stationRank: null,
      },
      include: { team: { select: { totalPoints: true } } },
    });
    for (const progress of unrankedCompleted) {
      if (progress.scoreAchieved === 10) continue;
      const delta = 10 - progress.scoreAchieved;
      const claim = await tx.teamStationProgress.updateMany({
        where: { id: progress.id, stationRank: null },
        data: { scoreAchieved: 10, scoreEnteredByUserId: null },
      });
      if (!claim.count) continue;
      await tx.team.update({
        where: { id: progress.teamId },
        data: { totalPoints: { increment: delta } },
      });
      await tx.scoreEvent.create({
        data: {
          teamId: progress.teamId,
          progressId: progress.id,
          stationId: 'ST009',
          scoreBefore: progress.team.totalPoints,
          scoreAfter: progress.team.totalPoints + delta,
          delta,
          reason: 'ST009_PROVISIONAL_NORMALIZATION',
        },
      });
    }

    const candidates = await tx.teamStationProgress.findMany({
      where: {
        stationId: 'ST009',
        status: ProgressStatus.COMPLETED,
        checkedInAt: { not: null },
        checkedOutAt: { not: null },
      },
    });
    candidates.sort((left, right) => {
      const durationDelta =
        left.checkedOutAt!.getTime() -
        left.checkedInAt!.getTime() -
        (right.checkedOutAt!.getTime() - right.checkedInAt!.getTime());
      return (
        durationDelta ||
        left.checkedOutAt!.getTime() - right.checkedOutAt!.getTime() ||
        left.teamId - right.teamId
      );
    });
    if (candidates.length > 25) {
      throw new Error('ST009 final ranking supports at most 25 completed Teams');
    }

    for (const [index, progress] of candidates.entries()) {
      if (progress.stationRank !== null) continue;
      const rank = index + 1;
      const score = 26 - rank;
      const delta = score - 10;
      const claim = await tx.teamStationProgress.updateMany({
        where: { id: progress.id, stationRank: null },
        data: { stationRank: rank, scoreAchieved: score },
      });
      if (!claim.count) continue;
      const team = await tx.team.findUniqueOrThrow({
        where: { id: progress.teamId },
        select: { totalPoints: true },
      });
      await tx.team.update({
        where: { id: progress.teamId },
        data: { totalPoints: { increment: delta } },
      });
      await tx.scoreEvent.create({
        data: {
          teamId: progress.teamId,
          progressId: progress.id,
          stationId: 'ST009',
          scoreBefore: team.totalPoints,
          scoreAfter: team.totalPoints + delta,
          delta,
          reason: 'ST009_FINAL_RANK',
        },
      });
      await tx.activityLog.create({
        data: {
          actorType: ActorType.SYSTEM,
          actorId: 'final-lifecycle',
          action: 'ST009_FINAL_RANKED',
          entityType: 'TEAM_STATION_PROGRESS',
          entityId: String(progress.id),
          metadata: {
            teamId: progress.teamId,
            stationRank: rank,
            score,
            finalizedAt: now.toISOString(),
          },
        },
      });
    }
  }
}

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ActorType, ProgressStatus } from '@prisma/client';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventConfigService } from './event-config.service';

@Injectable()
export class EventLifecycleService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly prisma: PrismaService, private readonly activityLog: ActivityLogService, private readonly eventConfig: EventConfigService) {}

  onModuleInit() {
    void this.reconcileFinalStart();
    this.timer = setInterval(() => void this.reconcileFinalStart(), 5_000);
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async reconcileFinalStart(now = new Date()) {
    if (!(await this.eventConfig.isPastFinalStart(now))) return 0;
    const candidates = await this.prisma.teamStationProgress.findMany({ where: { status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] }, checkedOutAt: null, completedAt: null }, select: { id: true, teamId: true, stationId: true } });
    let cancelled = 0;
    for (const progress of candidates) {
      const claim = await this.prisma.teamStationProgress.updateMany({ where: { id: progress.id, checkedOutAt: null, completedAt: null, status: { in: [ProgressStatus.CHECKED_IN, ProgressStatus.PLAYING] } }, data: { status: ProgressStatus.AVAILABLE, checkedInAt: null, checkedOutAt: null, completedAt: null, cancelledAt: now, nextCheckInAllowedAt: null, scoreAchieved: 0, scoreEnteredByUserId: null } });
      if (claim.count) {
        cancelled += 1;
        await this.activityLog.log({ actorType: ActorType.SYSTEM, actorId: 'final-lifecycle', action: 'FINAL_STARTED_CANCEL_STATION', entityType: 'TEAM_STATION_PROGRESS', entityId: progress.id, metadata: { teamId: progress.teamId, stationId: progress.stationId } });
      }
    }
    return cancelled;
  }
}

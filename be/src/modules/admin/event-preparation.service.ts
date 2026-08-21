import { ForbiddenException, Injectable } from '@nestjs/common';
import { ActorType, Prisma } from '@prisma/client';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import {
  acquireEventPreparationLock,
  assertEventPreparationConfirmation,
  EVENT_PREPARATION_RESET_CUTOFF,
  isEventPreparationResetAvailable,
  readEventPreparationInventory,
  resetGameplayInTransaction,
  rotateAllQrInTransaction,
} from '../../common/event-preparation/event-preparation-core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventPreparationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async status(now = new Date()) {
    const inventory = await readEventPreparationInventory(this.prisma, now);
    return {
      serverNow: now,
      resetCutoff: EVENT_PREPARATION_RESET_CUTOFF,
      resetEnabled: isEventPreparationResetAvailable(now) && inventory.ready,
      inventory,
    };
  }

  async resetGameplay(
    confirmation: string,
    backupConfirmed: boolean,
    now = new Date(),
  ) {
    if (!isEventPreparationResetAvailable(now)) {
      throw new ForbiddenException('EVENT_PREPARATION_RESET_CLOSED');
    }
    assertEventPreparationConfirmation(confirmation, backupConfirmed);
    return this.prisma.$transaction(
      async (tx) => {
        await acquireEventPreparationLock(tx);
        return resetGameplayInTransaction(tx, now);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async rotateAllQr(
    userId: number,
    confirmation: string,
    backupConfirmed: boolean,
    now = new Date(),
  ) {
    assertEventPreparationConfirmation(confirmation, backupConfirmed);
    const result = await this.prisma.$transaction(
      async (tx) => {
        await acquireEventPreparationLock(tx);
        return rotateAllQrInTransaction(tx, now);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: userId,
      userId,
      action: 'ROTATE_ALL_QR_CREDENTIALS',
      entityType: 'EVENT_PREPARATION',
      entityId: 'ALL',
      metadata: result,
    });
    return result;
  }
}

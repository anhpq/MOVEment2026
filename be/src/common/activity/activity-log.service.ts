import { Injectable } from '@nestjs/common';
import { ActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    actorType: ActorType;
    actorId: number | string;
    action: string;
    entityType: string;
    entityId: number | string;
    metadata?: Record<string, unknown>;
    userId?: number;
  }) {
    return this.prisma.activityLog.create({
      data: {
        actorType: input.actorType,
        actorId: String(input.actorId),
        action: input.action,
        entityType: input.entityType,
        entityId: String(input.entityId),
        metadata: this.toJson(input.metadata),
        userId: input.userId,
      },
    });
  }

  private toJson(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (!value) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}

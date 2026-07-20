import { BadRequestException, Injectable } from '@nestjs/common';
import { ActorType } from '@prisma/client';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEventConfigDto } from './dto/event-config.dto';

@Injectable()
export class EventConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async getConfig() {
    return this.prisma.eventConfig.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
  }

  async getPublicConfig() {
    const config = await this.getConfig();
    const serverNow = new Date();
    return {
      eventEndTime: config.eventEndTime,
      finalStartsAt: config.finalStartsAt,
      notifyBeforeMinutes: config.notifyBeforeMinutes,
      cancelCooldownMinutes: config.cancelCooldownMinutes,
      timezone: config.timezone,
      serverNow: serverNow.toISOString(),
      isPastEventEnd: this.isPastLocalTime(
        config.eventEndTime,
        serverNow,
        config.timezone,
      ),
    };
  }

  async updateConfig(dto: UpdateEventConfigDto, actorUserId: number) {
    if (dto.timezone) {
      this.assertValidTimezone(dto.timezone);
    }

    const config = await this.prisma.eventConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...dto,
        updatedByUserId: actorUserId,
      },
      update: {
        ...dto,
        updatedByUserId: actorUserId,
      },
    });
    await this.activityLog.log({
      actorType: ActorType.USER,
      actorId: actorUserId,
      userId: actorUserId,
      action: 'EVENT_CONFIG_UPDATED',
      entityType: 'EVENT_CONFIG',
      entityId: config.id,
      metadata: { ...dto },
    });
    return this.getPublicConfig();
  }

  async isPastEventEnd(now = new Date()) {
    const config = await this.getConfig();
    return this.isPastLocalTime(config.eventEndTime, now, config.timezone);
  }

  isPastLocalTime(hhmm: string, now = new Date(), timezone = 'Asia/Ho_Chi_Minh') {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const localParts = this.getLocalDateTimeParts(now, timezone);

    if (localParts.hour !== hours) {
      return localParts.hour > hours;
    }
    return localParts.minute >= minutes;
  }

  private assertValidTimezone(timezone: string) {
    try {
      this.getLocalDateTimeParts(new Date(), timezone);
    } catch {
      throw new BadRequestException('Invalid timezone');
    }
  }

  private getLocalDateTimeParts(date: Date, timezone: string) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [part.type, part.value]),
    );

    return {
      hour: Number(parts.hour),
      minute: Number(parts.minute),
    };
  }
}

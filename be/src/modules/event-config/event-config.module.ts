import { Module } from '@nestjs/common';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { EventConfigController } from './event-config.controller';
import { EventConfigService } from './event-config.service';
import { EventLifecycleService } from './event-lifecycle.service';

@Module({
  controllers: [EventConfigController],
  providers: [EventConfigService, EventLifecycleService, ActivityLogService],
  exports: [EventConfigService, EventLifecycleService],
})
export class EventConfigModule {}

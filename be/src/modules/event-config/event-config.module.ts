import { Module } from '@nestjs/common';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { EventConfigController } from './event-config.controller';
import { EventConfigService } from './event-config.service';

@Module({
  controllers: [EventConfigController],
  providers: [EventConfigService, ActivityLogService],
  exports: [EventConfigService],
})
export class EventConfigModule {}

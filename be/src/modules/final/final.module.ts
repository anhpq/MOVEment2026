import { Module } from '@nestjs/common';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { AuthModule } from '../auth/auth.module';
import { EventConfigModule } from '../event-config/event-config.module';
import { FinalController } from './final.controller';
import { FinalService } from './final.service';

@Module({
  imports: [AuthModule, EventConfigModule],
  controllers: [FinalController],
  providers: [FinalService, ActivityLogService],
})
export class FinalModule {}

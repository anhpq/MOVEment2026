import { Module } from '@nestjs/common';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { AuthModule } from '../auth/auth.module';
import { EventConfigModule } from '../event-config/event-config.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, EventConfigModule],
  controllers: [AdminController],
  providers: [AdminService, ActivityLogService],
})
export class AdminModule {}

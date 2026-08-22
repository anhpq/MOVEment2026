import { Module } from '@nestjs/common';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { AuthModule } from '../auth/auth.module';
import { EventConfigModule } from '../event-config/event-config.module';
import { TeamResultsModule } from '../team-results/team-results.module';
import { AdminController } from './admin.controller';
import { EventPreparationService } from './event-preparation.service';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, EventConfigModule, TeamResultsModule],
  controllers: [AdminController],
  providers: [AdminService, EventPreparationService, ActivityLogService],
})
export class AdminModule {}

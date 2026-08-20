import { Module } from '@nestjs/common';
import { EventConfigModule } from '../event-config/event-config.module';
import { TeamResultsService } from './team-results.service';

@Module({
  imports: [EventConfigModule],
  providers: [TeamResultsService],
  exports: [TeamResultsService],
})
export class TeamResultsModule {}

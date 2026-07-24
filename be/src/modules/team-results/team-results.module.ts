import { Module } from '@nestjs/common';
import { TeamResultsService } from './team-results.service';

@Module({
  providers: [TeamResultsService],
  exports: [TeamResultsService],
})
export class TeamResultsModule {}

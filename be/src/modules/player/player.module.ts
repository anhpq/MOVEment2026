import { Module } from '@nestjs/common';
import { ActivityLogService } from '../../common/activity/activity-log.service';
import { AuthModule } from '../auth/auth.module';
import { EventConfigModule } from '../event-config/event-config.module';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [AuthModule, EventConfigModule],
  controllers: [PlayerController, LeaderboardController],
  providers: [PlayerService, ActivityLogService],
  exports: [PlayerService],
})
export class PlayerModule {}

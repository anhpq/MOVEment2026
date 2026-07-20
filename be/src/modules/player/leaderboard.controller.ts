import { Controller, Get } from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  getLeaderboard() {
    return this.playerService.getLeaderboard();
  }
}

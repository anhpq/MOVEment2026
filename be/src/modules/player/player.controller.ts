import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentAuth } from '../../common/auth/auth.decorators';
import { AuthContext, isTeam } from '../../common/auth/auth-context';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { SubmitScoreDto } from '../../common/dto/score.dto';
import { QrActionDto } from './dto/player-actions.dto';
import { PlayerService } from './player.service';

@UseGuards(JwtAuthGuard)
@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('me')
  getMe(@CurrentAuth() auth: AuthContext) {
    return this.playerService.getDashboard(this.requireTeam(auth));
  }

  @Get('stations')
  getStations(@CurrentAuth() auth: AuthContext) {
    return this.playerService.getStations(this.requireTeam(auth));
  }

  @Get('progress')
  getProgress(@CurrentAuth() auth: AuthContext) {
    return this.playerService.getProgress(this.requireTeam(auth));
  }

  @Get('activity-log')
  getActivityLog(@CurrentAuth() auth: AuthContext) {
    return this.playerService.getActivityLog(this.requireTeam(auth));
  }

  @Post('stations/:stationId/check-in')
  checkIn(
    @CurrentAuth() auth: AuthContext,
    @Param('stationId') stationId: string,
    @Body() dto: QrActionDto,
  ) {
    return this.playerService.checkIn(this.requireTeam(auth), stationId, dto);
  }

  @Post('stations/:stationId/check-out')
  checkOut(
    @CurrentAuth() auth: AuthContext,
    @Param('stationId') stationId: string,
    @Body() dto: QrActionDto,
  ) {
    return this.playerService.checkOut(this.requireTeam(auth), stationId, dto);
  }

  @Post('stations/:stationId/score')
  submitScore(
    @CurrentAuth() auth: AuthContext,
    @Param('stationId') stationId: string,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.playerService.submitScore(this.requireTeam(auth), stationId, dto);
  }

  @Post('stations/:stationId/cancel')
  cancel(@CurrentAuth() auth: AuthContext, @Param('stationId') stationId: string) {
    return this.playerService.cancel(this.requireTeam(auth), stationId);
  }

  private requireTeam(auth: AuthContext) {
    if (!isTeam(auth)) {
      throw new ForbiddenException('Team token required');
    }
    return auth.id;
  }
}

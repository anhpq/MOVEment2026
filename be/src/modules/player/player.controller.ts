import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
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

  @Get('catalog')
  async getCatalog(
    @CurrentAuth() auth: AuthContext,
    @Query('lang') lang: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.requireTeam(auth);
    const catalog = await this.playerService.getCatalog(lang);
    const locale = lang?.trim().toLowerCase() === 'en' ? 'en' : 'vi';
    if (
      this.applyPrivateCache(
        request,
        response,
        `${catalog.catalogVersion}-${locale}`,
      )
    ) {
      return;
    }
    return catalog;
  }

  @Get('state')
  @Header('Cache-Control', 'no-store')
  getState(@CurrentAuth() auth: AuthContext) {
    return this.playerService.getState(this.requireTeam(auth));
  }

  @Get('stations')
  getStations(@CurrentAuth() auth: AuthContext, @Query('lang') lang?: string) {
    return this.playerService.getStations(this.requireTeam(auth), lang);
  }

  @Get('stations/playing-counts')
  getStationPlayingCounts(@CurrentAuth() auth: AuthContext) {
    this.requireTeam(auth);
    return this.playerService.getStationPlayingCounts();
  }

  @Get('stations/:stationId/images')
  async getStationImages(
    @CurrentAuth() auth: AuthContext,
    @Param('stationId') stationId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.requireTeam(auth);
    const [images, catalogVersion] = await Promise.all([
      this.playerService.getStationImages(stationId),
      this.playerService.getCatalogVersion(),
    ]);
    if (
      this.applyPrivateCache(
        request,
        response,
        `${catalogVersion}-${stationId}`,
      )
    ) {
      return;
    }
    return images;
  }

  @Get('leaderboard')
  @Header('Cache-Control', 'no-store')
  getPlayerLeaderboard(@CurrentAuth() auth: AuthContext) {
    this.requireTeam(auth);
    return this.playerService.getPlayerLeaderboard();
  }

  @Get('progress')
  getProgress(@CurrentAuth() auth: AuthContext, @Query('lang') lang?: string) {
    return this.playerService.getProgress(this.requireTeam(auth), lang);
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

  @Post('qr-action')
  qrAction(@CurrentAuth() auth: AuthContext, @Body() dto: QrActionDto) {
    return this.playerService.qrAction(this.requireTeam(auth), dto);
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

  private applyPrivateCache(
    request: Request,
    response: Response,
    version: string,
  ) {
    const etag = `"${version}"`;
    response.setHeader('Cache-Control', 'private, max-age=300, must-revalidate');
    response.setHeader('ETag', etag);
    if (request.header('If-None-Match') === etag) {
      response.status(HttpStatus.NOT_MODIFIED).end();
      return true;
    }
    return false;
  }
}

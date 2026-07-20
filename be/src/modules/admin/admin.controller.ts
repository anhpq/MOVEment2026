import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { CurrentAuth, Roles } from '../../common/auth/auth.decorators';
import { AuthContext, isAdmin } from '../../common/auth/auth-context';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import {
  ForceProgressStatusDto,
  ReopenProgressDto,
  SubmitScoreDto,
} from '../../common/dto/score.dto';
import { UpdateEventConfigDto } from '../event-config/dto/event-config.dto';
import { AdminService } from './admin.service';
import { UpdateStationDto } from './dto/update-station.dto';
import { CreateStationDto } from './dto/create-station.dto';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('teams')
  teams() {
    return this.adminService.teams();
  }

  @Post('teams')
  createTeam(@CurrentAuth() auth: AuthContext, @Body() dto: CreateTeamDto) {
    return this.adminService.createTeam(this.requireAdminId(auth), dto);
  }

  @Patch('teams/:teamId')
  updateTeam(
    @CurrentAuth() auth: AuthContext,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.adminService.updateTeam(this.requireAdminId(auth), teamId, dto);
  }

  @Delete('teams/:teamId')
  deleteTeam(
    @CurrentAuth() auth: AuthContext,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.adminService.deleteTeam(this.requireAdminId(auth), teamId);
  }

  @Get('teams/:teamId/progress')
  teamProgress(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.adminService.teamProgress(teamId);
  }

  @Get('score-queue')
  scoreQueue() {
    return this.adminService.scoreQueue();
  }

  @Get('progress-matrix')
  progressMatrix() {
    return this.adminService.progressMatrix();
  }

  @Patch('stations/:stationId')
  updateStation(
    @CurrentAuth() auth: AuthContext,
    @Param('stationId') stationId: string,
    @Body() dto: UpdateStationDto,
  ) {
    return this.adminService.updateStation(
      this.requireAdminId(auth),
      stationId,
      dto,
    );
  }

  @Post('stations')
  createStation(@CurrentAuth() auth: AuthContext, @Body() dto: CreateStationDto) {
    return this.adminService.createStation(this.requireAdminId(auth), dto);
  }

  @Delete('stations/:stationId')
  deleteStation(
    @CurrentAuth() auth: AuthContext,
    @Param('stationId') stationId: string,
  ) {
    return this.adminService.deleteStation(this.requireAdminId(auth), stationId);
  }

  @Post('progress/:progressId/score')
  submitScore(
    @CurrentAuth() auth: AuthContext,
    @Param('progressId', ParseIntPipe) progressId: number,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.adminService.submitScore(
      this.requireAdminId(auth),
      progressId,
      dto,
    );
  }

  @Patch('progress/:progressId/score')
  editScore(
    @CurrentAuth() auth: AuthContext,
    @Param('progressId', ParseIntPipe) progressId: number,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.adminService.editScore(
      this.requireAdminId(auth),
      progressId,
      dto,
    );
  }

  @Post('progress/:progressId/reopen')
  reopen(
    @CurrentAuth() auth: AuthContext,
    @Param('progressId', ParseIntPipe) progressId: number,
    @Body() dto: ReopenProgressDto,
  ) {
    return this.adminService.reopen(
      this.requireAdminId(auth),
      progressId,
      dto,
    );
  }

  @Patch('progress/:progressId/status')
  forceStatus(
    @CurrentAuth() auth: AuthContext,
    @Param('progressId', ParseIntPipe) progressId: number,
    @Body() dto: ForceProgressStatusDto,
  ) {
    return this.adminService.forceStatus(
      this.requireAdminId(auth),
      progressId,
      dto,
    );
  }

  @Get('event-config')
  eventConfig() {
    return this.adminService.getEventConfig();
  }

  @Patch('event-config')
  updateEventConfig(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpdateEventConfigDto,
  ) {
    return this.adminService.updateEventConfig(
      this.requireAdminId(auth),
      dto,
    );
  }

  @Get('activity-logs')
  activityLogs() {
    return this.adminService.activityLogs();
  }

  @Get('reports/summary.xlsx')
  async summaryReport(@CurrentAuth() auth: AuthContext, @Res() res: Response) {
    const report = await this.adminService.summaryReport(this.requireAdminId(auth));
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.send(report.buffer);
  }

  private requireAdminId(auth: AuthContext) {
    if (!isAdmin(auth)) {
      throw new ForbiddenException('Admin token required');
    }
    return auth.id;
  }
}

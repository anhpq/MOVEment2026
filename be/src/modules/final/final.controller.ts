import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentAuth, Roles } from '../../common/auth/auth.decorators';
import { AuthContext, isAdmin, isTeam } from '../../common/auth/auth-context';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { SubmitFinalDto, UpdateFinalConfigDto } from './dto/final.dto';
import { FinalService } from './final.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class FinalController {
  constructor(private readonly finalService: FinalService) {}

  @Get('player/final')
  getPlayerFinal(@CurrentAuth() auth: AuthContext) {
    if (!isTeam(auth)) {
      throw new ForbiddenException('Team token required');
    }
    return this.finalService.getPlayerFinal(auth.id);
  }

  @Post('player/final/submit')
  submitFinal(@CurrentAuth() auth: AuthContext, @Body() dto: SubmitFinalDto) {
    if (!isTeam(auth)) {
      throw new ForbiddenException('Team token required');
    }
    return this.finalService.submitFinal(auth.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/final-config')
  getFinalConfig() {
    return this.finalService.getFinalConfig();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/final/submissions')
  getSubmissions() {
    return this.finalService.getSubmissions();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/final-config')
  updateFinalConfig(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpdateFinalConfigDto,
  ) {
    if (!isAdmin(auth)) {
      throw new ForbiddenException('Admin token required');
    }
    return this.finalService.updateFinalConfig(auth.id, dto);
  }
}

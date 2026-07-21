import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../common/auth/auth.decorators';
import { AuthContext } from '../../common/auth/auth-context';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AuthService } from './auth.service';
import { TeamLoginDto, UserLoginDto } from './dto/login.dto';
import { QrLoginDto } from './dto/qr-login.dto';
import { TeamQrLoginDto } from './dto/team-qr-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  loginUser(@Body() dto: UserLoginDto) {
    return this.authService.loginUser(dto);
  }

  @Post('team-login')
  loginTeam(@Body() dto: TeamLoginDto) {
    return this.authService.loginTeam(dto);
  }

  @Post('team-qr-login')
  loginTeamWithQr(@Body() dto: TeamQrLoginDto) {
    return this.authService.loginTeamWithQr(dto);
  }

  @Post('qr-login')
  loginWithQr(@Body() dto: QrLoginDto) {
    return this.authService.loginWithQr(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentAuth() auth: AuthContext) {
    return this.authService.me(auth);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentAuth() auth: AuthContext) {
    return this.authService.logout(auth);
  }
}

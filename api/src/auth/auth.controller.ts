import { Controller, Post, UseGuards, Request, Response, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { Response as ResponseType } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Response({ passthrough: true }) res) {
    const token: string = await this.authService.login(req.user);
    let date = new Date();
    date.setDate(date.getDate() + 7);
    res.cookie('token', token, {expires: date});
  }

  @Get('logout')
  async logout(@Response({ passthrough: true }) res: ResponseType) {
    res.cookie('token', '', {expires: new Date() });
  }
}

import { Controller, Post, UseGuards, Request, Response, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { Response as ResponseType } from 'express';
import { ConnectUsersDto } from 'src/users/dto/connect-user.dto';

@ApiTags('authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @ApiOkResponse({type: ConnectUsersDto, isArray: false})
  @Post('login')
  async login(@Request() req, @Response({ passthrough: true }) res: ResponseType): Promise<ConnectUsersDto> {
    const token: string = await this.authService.login(req.user.id);
    let date = new Date();
    date.setDate(date.getDate() + 7);
    res.cookie('token', token, {expires: date});
    return req.user;
  }

  @Get('logout')
  async logout(@Response({ passthrough: true }) res: ResponseType) {
    res.cookie('token', '', {expires: new Date() });
  }
}

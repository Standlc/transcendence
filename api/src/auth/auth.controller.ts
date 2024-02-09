import { Controller, UseGuards, Request, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { Response, Response as ResponseType } from 'express';
import { ConnectUsersDto } from 'src/users/dto/connect-user.dto';
import { AppUser } from 'src/types/clientSchema';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { OauthGuard } from './oauth.guard';

@ApiTags('authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

  /**
   * GET /api/auth/42
   * This is the route the user will visit to authenticate using the 42 API
   */
  @Get('oauth')
  @UseGuards(OauthGuard)
  login() {
    return;
  }

  /**
   * GET /api/auth/redirect
   * This is the route the user will visit to get a JWT Token after visiting 42
   */
    @Get('redirect')
    @UseGuards(OauthGuard)
    redirect(@Res() res: Response) {
      res.redirect('http://localhost:3000/');
    }

  /**
   * GET /api/auth/login
   * This is the route the user will visit to authenticate using an username
   * with a passord
   */
  @UseGuards(LocalAuthGuard)
  @ApiOkResponse({type: ConnectUsersDto, isArray: false})
  @Get('login')
  async loginWithPassword(@Request() req, @Res({ passthrough: true }) res: ResponseType): Promise<AppUser> {
    const token: string = await this.authService.login(req.user.id);
    let date = new Date();
    date.setDate(date.getDate() + 7);
    res.cookie('token', token, {expires: date});
    return req.user;
  }

  /**
   * GET /api/auth/token
   * This is the route the user will visit to authenticate using an existing
   * token
   */
  @UseGuards(JwtAuthGuard)
  @Get('token')
  async loginWithToken(@Request() req): Promise<AppUser | undefined> {
    return await this.usersService.getUserById(req.user.id);
  }

  /**
   * GET /api/auth/logout
   * This is the route the user will visit to logout
   */
  @Get('logout')
  async logout(@Res({ passthrough: true }) res: ResponseType) {
    res.cookie('token', '', {expires: new Date() });
  }
}

import { Controller, UseGuards, Request, Get, Res, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { Response, Response as ResponseType } from 'express';
import { AppUser } from 'src/types/clientSchema';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { OauthGuard } from './oauth.guard';
import { HttpExceptionFilter } from './redirect-exception.filter';

@ApiTags('authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

  /**
   * GET /api/auth/oauth
   * This is the route the user will visit to authenticate using the 42 API
   */
  @Get('oauth')
  @UseGuards(OauthGuard)
  async login() {
    return ;
  }

  /**
   * GET /api/auth/redirect
   * This is the route the user will visit to get a JWT Token after visiting 42,
   * We could do everything using just the /api/auth/oauth route. But this is less
   * complex to understand.
   */
    @Get('redirect')
    @UseGuards(OauthGuard)
    @UseFilters(HttpExceptionFilter)
    async redirect(@Request() req, @Res() res: Response) {
      const token: string = await this.authService.login(req.user.id);
      let date = new Date();
      date.setDate(date.getDate() + 7);
      res.cookie('token', token, {expires: date});
      res.redirect('http://localhost:3000/');
    }

  /**
   * GET /api/auth/login
   * This is the route the user will visit to authenticate using an username
   * with a passord
   */
  @UseGuards(LocalAuthGuard)
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

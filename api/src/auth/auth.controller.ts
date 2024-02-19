import { Controller, UseGuards, Request, Get,  Post, Res, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiDefaultResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiCreatedResponse } from '@nestjs/swagger';
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

  //#region oauth

  /**
   * GET /api/auth/oauth
   * This is the route the user will visit to authenticate using the 42 API
   */
  @ApiDefaultResponse({description: "Nothing to return, the user will be redirected to the 42 API"})
  @Get('oauth')
  @UseGuards(OauthGuard)
  login() {
    return ;
  }

  //#endregion

  //#region redirect

  /**
   * GET /api/auth/redirect
   * This is the route the user will visit to get a JWT Token after visiting 42,
   * We could do everything using just the /api/auth/oauth route. But this is less
   * complex to understand.
   */
  @ApiQuery({
    name: 'code',
    required: true,
    description: "User token of 42 API. Note: This endpoint should not be use directly, as you will never get a valid token for the 42 API. This endpoint purpose is solely for the 42 API."
  })
  @ApiOkResponse({
    description: "This will redirect to either localhost:3000/ if a jwt as been generated, or localhost:3000/login?code=x if something went wrong. Note that x will be replaced with a string of the error."
  }) 
  @Get('redirect')
  @UseGuards(OauthGuard)
  @UseFilters(HttpExceptionFilter)
  async redirect(@Request() req, @Res() res: Response) {
    const token: string = await this.authService.login(req.user.id);
    let date = new Date();
    date.setDate(date.getDate() + 7);
    res.cookie('token', token, {expires: date});
    res.redirect(process.env.FRONTEND_URL ? process.env.FRONTEND_URL : '');
  }

    //#endregion

  //#region login

  /**
   * POST /api/auth/login
   * This is the route the user will visit to authenticate using an username
   * with a passord
   */
  @ApiBody({
    description: "User credential",
    required: true,
    schema: {
      type: 'application/json',
      example: {
        username: "john",
        password: "STRONGPASSWORD"
      }
    }
  })
  @ApiCreatedResponse({
    description: "User logged in, a cookie will be added with a jwt token",
    schema: {
      type: 'object',
      example: {
        avatarUrl: null,
        bio: null,
        createdAt: "2024-02-16T14:28:58.410Z",
        email: null,
        firstname: "john",
        id: 1,
        lastname: "doe",
        rating: 18,
        username: "joe"
      }
    }
  }) 
  @ApiUnauthorizedResponse({description: "User credential is invalid"})
  @ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async loginWithPassword(@Request() req, @Res({ passthrough: true }) res: ResponseType): Promise<AppUser> {
    const token: string = await this.authService.login(req.user.id);
    let date = new Date();
    date.setDate(date.getDate() + 7);
    res.cookie('token', token, {expires: date});
    return req.user;
  }

  //#endregion

  //#region token

  /**
   * GET /api/auth/token
   * This is the route the user will visit to authenticate using an existing
   * token
   */
  @ApiOkResponse({
    description: "User token is valid",
    schema: {
      type: 'object',
      example: {
        avatarUrl: null,
        bio: null,
        createdAt: "2024-02-16T14:28:58.410Z",
        email: null,
        firstname: "john",
        id: 1,
        lastname: "doe",
        rating: 18,
        username: "joe"
      }
    }
  })
  @ApiUnauthorizedResponse({description: "User token is invalid"})
  @ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
  @UseGuards(JwtAuthGuard)
  @Get('token')
  async loginWithToken(@Request() req): Promise<AppUser | undefined> {
    return await this.usersService.getUserById(req.user.id);
  }

  //#endregion

  //#region logout

  /**
   * GET /api/auth/logout
   * This is the route the user will visit to logout
   */
  @ApiOkResponse({description: "User logged out"})
  @Get('logout')
  async logout(@Res({ passthrough: true }) res: ResponseType) {
    res.cookie('token', '', {expires: new Date() });
  }

  //#endregion
}

import { Controller, UseGuards, Request, Get,  Post, Res, UseFilters, Req, Body, UnauthorizedException, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiDefaultResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { Response, Response as ResponseType } from 'express';
import { AppUser } from 'src/types/clientSchema';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { OauthGuard } from './oauth.guard';
import { HttpExceptionFilter } from './redirect-exception.filter';
import { Jwt2faAuthGuard } from './jwt-2fa-auth.guard';

@ApiTags('authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

  //#region oauth

  /**
   * GET /api/auth/oauth
   * This is the route the user will visit to authenticate using the 42 API
   */
  @ApiOperation({summary: "Redirect user here to redirect them to the 42 API"})
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
  @ApiOperation({summary: "This handle the redirect of 42 API, do not use directly"})
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
  async redirect(@Request() req, @Res() res: Response): Promise<string | undefined> {
    if (!req.user.id)
      throw new UnauthorizedException("Missing id from payload");
    const session: {
      jwt: string,
      expires: Date
    } = await this.authService.login(req.user.id);
    res.cookie('token', session.jwt, {
      expires: session.expires,
      sameSite: 'strict',
      httpOnly: true
    });
    if (process.env.FRONTEND_URL) {
      res.redirect(process.env.FRONTEND_URL);
      return undefined;
    }
    return "This server is missing a front end to redirect...";
  }

  //#endregion

  //#region login

  /**
   * POST /api/auth/login
   * This is the route the user will visit to authenticate using an username
   * with a passord
   */
  @ApiOperation({summary: "Login a user"})
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
    description: "User logged in, a cookie will be added with a jwt token, if the user activate 2FA, it will return {\"isTwoFactorAuthenticationEnabled\": true}.",
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
  async loginWithPassword(@Request() req, @Res({ passthrough: true }) res: ResponseType): Promise<Partial<AppUser>> {
    if (!req.user.id)
      throw new UnauthorizedException("Missing Id from the payload");
    const session: {
      jwt: string,
      expires: Date
    } = await this.authService.login(req.user.id);
    res.cookie('token', session.jwt, {
      expires: session.expires,
      sameSite: 'strict',
      httpOnly: true
    });
    if (req.user.isTwoFactorAuthenticationEnabled)
      return { isTwoFactorAuthenticationEnabled: req.user.isTwoFactorAuthenticationEnabled };
    return req.user;
  }

  //#endregion

  //#region Activate 2FA

  @ApiOperation({summary: "Get a qrcode to activate 2FA"})
  @ApiOkResponse({description: "Return a string containing a qrcode PNG in base64 format"})
  @ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
  @Get('2fa/activate')
  @UseGuards(JwtAuthGuard)
  async activateTwoFactorAuthentication(@Req() req): Promise<string> {
    const otpAuthUrl: string = await this.authService.generateTwoFactorAuthenticationSecret(req.user.id);
    return await this.authService.generateQrCodeDataUrl(otpAuthUrl);
  }

  //#endregion

  //#region Turn On 2FA

  @ApiOperation({summary: "Turn on the 2FA if the code generate with the qrcode was valid"})
  @ApiCreatedResponse({description: "Return nothing, 2FA is turned on"})
  @ApiQuery({
    description: "The code the client generate using their app",
    name: 'code'
  })
  @ApiUnauthorizedResponse({description: "2FA code is invalid"})
  @ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
  @Post('2fa/turn-on')
  @UseGuards(JwtAuthGuard)
  async turnOnTwoFactorAuthentication(@Res({ passthrough: true }) res, @Req() req, @Query('code') twoFactorAuthenticationCode) {
    const isCodeValid = await this.authService.isTwoFactorAuthenticationCodeValid(
      twoFactorAuthenticationCode,
      req.user.id
    );
    if (!isCodeValid) {
      throw new UnauthorizedException("Invalid otp code");
    }
    await this.usersService.turnOnTwoFactorAuthentication(req.user.id);
    const session: {
      jwt: string,
      expires: Date
    } = await this.authService.loginWith2fa(req.user.id);
    res.cookie('token', session.jwt, {
      expires: session.expires,
      sameSite: 'strict',
      httpOnly: true
    });
  }

  //#endregion

  @ApiOperation({summary: "Authenticate 2FA step"})
  @ApiCreatedResponse({
    description: "User logged in, a cookie will be added with a jwt token.",
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
  @ApiUnauthorizedResponse({description: "2FA code is invalid"})
  @ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
  @Post('2fa/authenticate')
  @UseGuards(Jwt2faAuthGuard)
  async authenticate(@Req() req, @Res({ passthrough: true }) res: ResponseType, @Query('code') twoFactorAuthenticationCode) {
    if (!req.user.id)
      throw new UnauthorizedException('Missing Id from the payload');
    const isCodeValid = await this.authService.isTwoFactorAuthenticationCodeValid(
      twoFactorAuthenticationCode,
      req.user.id
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    const session: {
      jwt: string,
      expires: Date
    } = await this.authService.login(req.user.id);
    res.cookie('token', session.jwt, {
      expires: session.expires,
      sameSite: 'strict',
      httpOnly: true
    });
    return await this.usersService.getUserById(req.user.id);
  }

  //#region token

  /**
   * GET /api/auth/token
   * This is the route the user will visit to authenticate using an existing
   * token
   */
  @ApiOperation({summary: "Return AppUser if you have a valid token"})
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
  @ApiOperation({summary: "Logout a user"})
  @ApiOkResponse({description: "User logged out"})
  @Get('logout')
  async logout(@Res({ passthrough: true }) res: ResponseType) {
    res.cookie('token', '', {
      expires: new Date(),
      sameSite: 'strict',
      httpOnly: true
    });
  }

  //#endregion
}

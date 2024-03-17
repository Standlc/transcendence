import { Body, Controller, Get, Patch, Param, Post, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors, ParseFilePipeBuilder, HttpStatus, UnprocessableEntityException, NotFoundException, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBody, ApiCookieAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { CreateUsersDto } from './dto/create-users.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AppUser, ListUsers, UserProfile, UserSearchResult } from 'src/types/clientSchema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateUsersDto } from './dto/update-users.dto';
import { isStrongPassword } from 'class-validator';
import { BlockedUserService } from 'src/blocked-user/blocked-user.service';

@ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly blockUserService: BlockedUserService
  ) {}

  //#region register

  @ApiOperation({summary: "Register a user"})
  @ApiCreatedResponse({
    description: "User registered",
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
        username: "joe",
        status: 1
      }
    }
  })
  @ApiUnprocessableEntityResponse({description: "Username already taken | Username was empty | Password is not strong enough | Username is too long"})
  @ApiBody({
    description: "User credential",
    required: true,
    schema: {
      type: 'application/json',
      example: {
        username: "john",
        password: "STRONGPASSWORD",
        firstname: null,
        lastname: null
      }
    }
  })
  @Post('register')
  async createUser(@Body() body: CreateUsersDto): Promise<AppUser> {
    if (!isStrongPassword(body.password))
      throw new UnprocessableEntityException("Password is not strong enough");
    if (body.username.length > 50)
      throw new UnprocessableEntityException("Username is too long");
    return await this.usersService.createUser(body);
  }

  //#endregion

  //#region find

  @ApiOperation({summary: "Find all user mathing a substring"})
  @ApiCookieAuth()
  @ApiOkResponse({
    description: "An array of every user mathing the name substring",
    schema: {
      type: 'object',
      example: [{
        avatarUrl: null,
        bio: null,
        createdAt: "2024-02-16T14:28:58.410Z",
        email: null,
        firstname: "john",
        id: 1,
        lastname: "doe",
        rating: 18,
        username: "joe",
        status: 1
      }]
    },
    isArray: true
  })
  @ApiQuery({name: 'name', required: true, description: "This doesn't need to be the exact username"})
  @ApiNotFoundResponse({description: "No user was found with that substring in there username"})
  @ApiUnauthorizedResponse({description: "You need to be logged in the access this route"})
  @UseGuards(JwtAuthGuard)
  @Get('find')
  async getUsers(@Query('name') name: string, @Req() req): Promise<UserSearchResult[]> {
    const userId: number = req.user.id;
    return await this.usersService.findUsersByName(userId, name);
  }

  //#endregion

  //#region profile

  @ApiOperation({summary: "Get a user profile"})
  @ApiCookieAuth()
  @ApiOkResponse({
    description: "User object",
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
        username: "joe",
        status: 1
      }
    },
    isArray: false
  })
  @ApiNotFoundResponse({description: "No user was found with that ID"})
  @ApiUnprocessableEntityResponse({description: "When you try to retrieve a profile of someone who block you"})
  @ApiUnauthorizedResponse({description: "You need to be logged in the access this route"})
  @UseGuards(JwtAuthGuard)
  @Get('/profile/:userId')
  async getUserProfile(@Request() req, @Param('userId') userId: number): Promise<UserProfile> {
    const userProfile = await this.usersService.getUserProfile(req.user.id, userId);
    if (!userProfile) {
      throw new NotFoundException();
    }
    return userProfile;
  }

  //#endregion

  //#region update
  @ApiOperation({summary: "Update user profile"})
  @ApiCookieAuth()
  @ApiOkResponse({description: "Profile updated"})
  @ApiUnprocessableEntityResponse({description: "Invalid field | empty field | username too long"})
  @ApiBody({
    description: "UpdateUserDto",
    schema: {
      type: 'object',
      example: {
        bio: "bio",
        firstname: "john",
        lastname: "doe"
      }
    },
  })
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async updateUserProfile(@Request() req, @Body() body: UpdateUsersDto) {
    await this.usersService.updateUser(req.user.id, body);
  }

  //#endregion

  //#region list

  @ApiOperation({summary: "Get every user in the database"})
  @ApiCookieAuth()
  @ApiOkResponse({
    description: "An array of every user in the database",
    schema: {
      type: 'object',
      example: [{
        avatarUrl: null,
        username: 'joe',
        id: 1
      },
      {
        avatarUrl: null,
        username: 'noe',
        id: 2
      }]
    },
    isArray: true
  })
  @ApiUnauthorizedResponse({description: "You need to be logged in the access this route"})
  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getUserList(): Promise<ListUsers[] | null> {
    return await this.usersService.getUserList();
  }

  //#endregion

  //#region Get Avatar

  @ApiOperation({summary: "Get the avatar using fileId"})
  @ApiCookieAuth()
  @ApiParam({name: 'fileId', description: 'Should start with /api/users'})
  @ApiOkResponse({description: "Image file"})
  @ApiNotFoundResponse({description: "No such file exist"})
  @UseGuards(JwtAuthGuard)
  @Get('avatar/:fileId')
  async getAvatar(@Param('fileId') fileId, @Res() res) {
    res.sendFile(fileId, { root: './public/avatar' });
  }

  //#endregion

}

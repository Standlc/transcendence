import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBody, ApiCookieAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { CreateUsersDto } from './dto/create-users.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AppUser, ListUsers } from 'src/types/clientSchema';

@ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //#region register

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
        username: "joe"
      }
    }
  })
  @ApiUnprocessableEntityResponse({description: "Username already taken | Username was empty"})
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
    return await this.usersService.createUser(body);
  }

  //#endregion

  //#region find

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
        username: "joe"
      }]
    },
    isArray: true
  })
  @ApiQuery({name: 'name', required: true, description: "This doesn't need to be the exact username"})
  @ApiNotFoundResponse({description: "No user was found with that substring in there username"})
  @ApiUnauthorizedResponse({description: "You need to be logged in the access this route"})
  @UseGuards(JwtAuthGuard)
  @Get('find')
  async getUsers(@Query('name') name: string): Promise<AppUser[]> {
    return await this.usersService.findUsersByName(name);
  }

  //#endregion

  //#region profile

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
        username: "joe"
      }
    },
    isArray: false
  })
  @ApiNotFoundResponse({description: "No user was found with that ID"})
  @ApiUnauthorizedResponse({description: "You need to be logged in the access this route"})
  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: number): Promise<AppUser> {
    return await this.usersService.getUserById(userId);
  }

  //#endregion

  //#region list

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

}

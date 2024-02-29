import { Body, Controller, Get, Patch, Param, Post, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBody, ApiCookieAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { CreateUsersDto } from './dto/create-users.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AppUser, ListUsers } from 'src/types/clientSchema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateUsersDto } from './dto/update-users.dto';

@ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  async getUsers(@Query('name') name: string): Promise<AppUser[]> {
    return await this.usersService.findUsersByName(name);
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
  @ApiUnauthorizedResponse({description: "You need to be logged in the access this route"})
  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: number): Promise<AppUser> {
    return await this.usersService.getUserById(userId);
  }

  //#endregion

  //#region update
  @ApiOperation({summary: "Update user profile"})
  @ApiCookieAuth()
  @ApiOkResponse({description: "Profile updated"})
  @ApiUnprocessableEntityResponse({description: "Invalid field or empty field"})
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

  //#region avatar

  @ApiOperation({summary: "Upload an avatar"})
  @ApiCookieAuth()
  @ApiCreatedResponse({
    description: "Avatar succesfully uploaded",
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
  })
  @ApiBody({
    description: "This is a multipart/form-data body, the name should be 'file' and the attachement an image binary",
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file',
    {
      storage: diskStorage({
        destination: './public/avatar',
        filename: (req, file, cb) => {
          const randomName = Date.now().toString();
          return cb(null, `${randomName}${extname(file.originalname)}`);
        }
      })
    }
  ))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File): Promise<AppUser> {
    return this.usersService.setAvatar(req.user.id, `/api/users/${file.path}`);
  }

  @ApiOperation({summary: "Get the avatar using fileId"})
  @ApiCookieAuth()
  @ApiParam({name: 'fileId', description: 'Should start with /api/users'})
  @ApiOkResponse({description: "Image file"})
  @ApiNotFoundResponse({description: "No such file exist"})
  @UseGuards(JwtAuthGuard)
  @Get('avatar/:fileId')
  async sendAvatar(@Param('fileId') fileId, @Res() res) {
    res.sendFile(fileId, { root: './public/avatar' });
  }

  //#endregion

}

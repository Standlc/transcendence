import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateUsersDto } from './dto/create-users.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AppUser, ListUsers } from 'src/types/clientSchema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * ? Create a new user in the database.
   * @param body
   * @returns 'success' if the user register, otherwise 'error' is returned.
   */
  @ApiCreatedResponse({type: 'success'})
  @Post('register')
  async createUser(@Body() body: CreateUsersDto): Promise<string> {
    return await this.usersService.createUser(body);
  }

  /**
   * ? Return a subset of user(s) data, matching the name substring.
   * @param name
   * @returns AppUser[]
   */
  @ApiOkResponse({type: Promise<AppUser>, isArray: true})
  @ApiQuery({name: 'name', required: true})
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(@Query('name') name: string): Promise<AppUser[]> {
    const result = await this.usersService.findUsersByName(name);

    if (!result || result.length == 0)
      throw new NotFoundException();
    return result;
  }

  /**
   * ? Return a subset of user data.
   * @param userId
   * @returns AppUser
   */
  @ApiOkResponse({type: Promise<AppUser>, isArray: false})
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: number): Promise<AppUser> {
    const result = await this.usersService.getUserById(userId);

    if (!result)
      throw new NotFoundException();
    return result;
  }

  /**
   * ? Return a list of subset of every user data.
   * @returns ListUsers[] | null
   */
  @ApiOkResponse({type: Promise<ListUsers>, isArray: true})
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getUserList(): Promise<ListUsers[] | null> {
    return await this.usersService.getUserList();
  }

}

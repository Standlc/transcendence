import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserList } from './dto/user-list.dto';
import { Selectable } from 'kysely';
import { CreateUsersDto } from './dto/create-users.dto';
import { User } from 'src/types/schema';

//TODO: Add guards to protect API endpoint
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //#region <-- Post request -->

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

  //#endregion

  //#region <-- Get request -->

  /**
   * ? Return a subset of user(s) data, matching the name substring.
   * @param name
   * @returns UserProfileDto[]
   */
  @ApiOkResponse({type: UserProfileDto, isArray: true})
  @ApiQuery({name: 'name', required: true})
  @ApiNotFoundResponse()
  @Get()
  async getUsers(@Query('name') name: string): Promise<UserProfileDto[]> {
    const result = await this.usersService.findUsersByName(name);

    if (!result || result.length == 0)
      throw new NotFoundException();
    return result;
  }

  /**
   * ? Return a subset of user data.
   * @param userId
   * @returns UserProfileDto
   */
  @ApiOkResponse({type: UserProfileDto, isArray: false})
  @ApiNotFoundResponse()
  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: number): Promise<UserProfileDto> {
    const result = await this.usersService.getUserById(userId);

    if (!result)
      throw new NotFoundException();
    return result;
  }

  /**
   * ? Return a list of subset of every user data.
   * @returns UserList[] | null
   */
  @ApiOkResponse({type: UserList, isArray: true})
  @Get('list')
  async getUserList(): Promise<UserList[] | null> {
    return await this.usersService.getUserList();
  }

  //#endregion
}

import { Injectable } from '@nestjs/common';
import { InsertResult } from 'kysely';
import { db } from 'src/database';
import { CreateUsersDto } from './dto/create-users.dto';
import * as bcrypt from 'bcrypt';
import { UserList } from './dto/user-list.dto';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  async createUser(createUsersDto: CreateUsersDto): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(createUsersDto.password, 10);
      if (createUsersDto.username == "")
        throw "Empty username";
      const result = await db
      .insertInto('user')
      .values({
        username: createUsersDto.username,
        password: hashedPassword,
        firstname: createUsersDto.firstname,
        lastname: createUsersDto.lastname
      })
      .executeTakeFirstOrThrow();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async findUserById(userId: number): Promise<UserProfileDto | null> {
    try {
      //? Fetch the databse and search for a user with userId
      //? Crete a DTO object containing only the needed properties for showing a user profile.
      const user: UserProfileDto = await db
      .selectFrom('user')
      .select(['username', 'bio', 'avatarUrl', 'firstname', 'lastname'])
      .where('id', '=', userId)
      .executeTakeFirstOrThrow();

      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async findUsersByName(substring: string): Promise<UserProfileDto[] | null> {
    //? Fetch the database and search for any user containing a substring in the username field.
    //? Create an array of DTO object or a single DTO object containing the UserProfileDto of any user that matches the substring.
    const user: UserProfileDto[] | null = await db
    .selectFrom('user')
    .select(['username', 'bio', 'avatarUrl', 'firstname', 'lastname'])
    .where('username', 'like', '%' + substring + '%')
    .execute();
    return user;
  }

  async getUserList(): Promise<UserList[] | null> {
    try {
      let userList: UserList[] = await db
      .selectFrom('user')
      .select(['id', 'username', 'avatarUrl'])
      .execute();
      return userList;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

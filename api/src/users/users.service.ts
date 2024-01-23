import { Injectable } from '@nestjs/common';
import { db } from 'src/database';
import { CreateUsersDto } from './dto/create-users.dto';
import * as bcrypt from 'bcrypt';
import { AppUser, ListUsers } from 'src/types/clientSchema';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService {
  async createUser(createUsersDto: CreateUsersDto): Promise<string> {
    try {
      const hashedPassword = await bcrypt.hash(createUsersDto.password, 10);
      if (createUsersDto.username == "")
        throw "Empty username";
      await db
      .insertInto('user')
      .values({
        username: createUsersDto.username,
        password: hashedPassword,
        firstname: createUsersDto.firstname,
        lastname: createUsersDto.lastname
      })
      .executeTakeFirstOrThrow();
      return 'success';
    } catch (error) {
      return 'error';
    }
  }

  async getUserById(userId: number): Promise<AppUser | undefined> {
    try {
      //? Fetch the databse and search for a user with userId
      const user = await db
      .selectFrom('user')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirstOrThrow();

      //? Create a AppUser containing every field, except password.
      const {password, ...appUser} = user;
      return appUser;
    } catch (error) {
      return undefined;
    }
  }

  async findUsersByName(substring: string): Promise<AppUser[] | null> {
    //? Fetch the database and search for any user containing a substring in the username field.
    //? Create an array of AppUser containing every field except password of any user that matches the substring.
    const user: AppUser[] | null = await db
    .selectFrom('user')
    .select(['username', 'bio', 'avatarUrl', 'firstname', 'lastname', 'createdAt', 'email', 'id'])
    .where('username', 'like', '%' + substring + '%')
    .execute();
    return user;
  }

  async getUserByName(username: string): Promise<AppUser | undefined> {
    const user = await db
    .selectFrom('user')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();
    if (user) {
      const {password, ...appUser} = user;
      return appUser;
    }
  }

  async validateUser(loginUserDto: LoginUserDto): Promise<AppUser | undefined> {
    try {
      const user = await db
      .selectFrom('user')
      .selectAll()
      .where('username', '=', loginUserDto.username)
      .executeTakeFirstOrThrow();

      const result = await bcrypt.compare(loginUserDto.password, user.password);
      if (!result)
        return ;

      const {password, ...appUser} = user;
      return appUser;
    } catch (error) {
      return ;
    }
  }

  async getUserList(): Promise<ListUsers[] | null> {
    try {
      let userList: ListUsers[] = await db
      .selectFrom('user')
      .select(['id', 'username', 'avatarUrl'])
      .execute();
      return userList;
    } catch (error) {
      return null;
    }
  }
}

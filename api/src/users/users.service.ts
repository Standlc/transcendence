import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { db } from 'src/database';
import { CreateUsersDto } from './dto/create-users.dto';
import * as bcrypt from 'bcrypt';
import { AppUser, ListUsers } from 'src/types/clientSchema';
import { LoginUserDto } from './dto/login-user.dto';
import { userFromIntra } from 'src/auth/oauth.strategy';
import { randomBytes } from 'crypto';

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

  /**
   * Create a user in the db for oauth, we generate a password for the user,
   * but we don't communicate to them, since they will use oauth to connect.
   * They will be able to change the password if they want to connect without
   * oauth though.
   * @param intraUser 
   * @returns True if we correctly create a new user, false otherwise
   * @throws InternalServerError if the db fail
   */
  async createOauthUser(intraUser: userFromIntra): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(randomBytes(32), 10);
      const result = await db
      .insertInto('user')
      .values({
        email: intraUser.email,
        username: intraUser.username,
        avatarUrl: intraUser.avatarUrl,
        firstname: intraUser.firstname,
        lastname: intraUser.lastname,
        password: hashedPassword
      })
      .executeTakeFirst();
      if (result.numInsertedOrUpdatedRows === 0n)
        return false;
      return true;
    } catch (error) {
      throw new InternalServerErrorException();
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
    .select(['username', 'bio', 'avatarUrl', 'firstname', 'lastname', 'createdAt', 'email', 'id', 'rating'])
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

  //todo: recheck every function in this file

  /**
   * Looking for a user matching the email string passed as parameter.
   * @param email 
   * @returns an AppUser
   * @throws NotFound if no user was found with this email
   * @throws InternalServerError if we fail to use the db.
   */
  async getUserByEmail(email: string): Promise<AppUser> {
    let user: AppUser | undefined;
    try {
      user = await db
      .selectFrom('user')
      .select(['avatarUrl', 'bio', 'createdAt', 'email', 'firstname', 'id', 'lastname', 'username'])
      .where('email', '=', email)
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!user)
      throw new NotFoundException();
    return user;
  }

  //TODO : test la connexion, user not found, invalid password...
  async validateUser(loginUserDto: LoginUserDto): Promise<AppUser> {
    try {
      const user = await db
      .selectFrom('user')
      .selectAll()
      .where('username', '=', loginUserDto.username)
      .executeTakeFirstOrThrow();

      const result = await bcrypt.compare(loginUserDto.password, user.password);
      if (!result)
        throw new UnauthorizedException();

      const {password, ...appUser} = user;
      return appUser;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException)
        throw new UnauthorizedException;
      throw new InternalServerErrorException();
    }
  }

  async getUserList(): Promise<ListUsers[] | null> {
    try {
      let userList: ListUsers[] = await db
      .selectFrom('user')
      .select(['id', 'username', 'avatarUrl', 'rating'])
      .execute();
      return userList;
    } catch (error) {
      return null;
    }
  }
}

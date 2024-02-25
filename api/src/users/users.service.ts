import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { db } from 'src/database';
import { CreateUsersDto } from './dto/create-users.dto';
import * as bcrypt from 'bcrypt';
import { AppUser, AppUserDB, ListUsers } from 'src/types/clientSchema';
import { userFromIntra } from 'src/auth/oauth.strategy';
import { randomBytes } from 'crypto';
import { User } from 'src/types/schema';
import { Selectable, UnaryOperationNode, UpdateResult } from 'kysely';
import { UpdateUsersDto } from './dto/update-users.dto';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';

@Injectable()
export class UsersService {
  constructor(private readonly usersStatusGateway: UsersStatusGateway) {}

  /**
   * Create a user in the database using createUserDto values
   * @param createUsersDto 
   * @returns AppUser
   * @throws InternalServerError
   * @throws UnprocessableEntity
   */
  async createUser(createUsersDto: CreateUsersDto): Promise<AppUser> {
    if (createUsersDto.username == "" || !createUsersDto.username) {
      console.log("Tried to register without a username");
      throw new UnprocessableEntityException("Empty username");
    }
    try {
      const result = await db
      .selectFrom('user')
      .selectAll()
      .where('username', '=', createUsersDto.username)
      .executeTakeFirst()
      if (result)
        throw new UnprocessableEntityException("Username already taken");
    } catch (error) {
      if (error instanceof UnprocessableEntityException)
        throw error;
      throw new InternalServerErrorException();
    }
    try {
      const hashedPassword = await bcrypt.hash(createUsersDto.password, 10);
       const result = await db
      .insertInto('user')
      .values({
        username: createUsersDto.username,
        password: hashedPassword,
        firstname: createUsersDto.firstname,
        lastname: createUsersDto.lastname
      })
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    let userDB: AppUserDB;
    try {
      userDB = await db
      .selectFrom('user')
      .select(['avatarUrl', 'bio', 'createdAt', 'email', 'firstname', 'id', 'lastname', 'rating', 'username'])
      .where('username', '=', createUsersDto.username)
      .executeTakeFirstOrThrow()
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    return {
      ...userDB,
      status: this.usersStatusGateway.getUserStatus(userDB?.id)
    };
  }

  /**
   * Create a user in the db for oauth, we generate a password for the user,
   * but we don't communicate to them, since they will use oauth to connect.
   * They will be able to change the password if they want to connect without
   * oauth though.
   * @param intraUser 
   * @throws InternalServerError if the db fail
   * @throws UnprocessableEntity if the username is already taken
   */
  async createOauthUser(intraUser: userFromIntra) {
    try {
      const result = await db
      .selectFrom('user')
      .selectAll()
      .where('username', '=', intraUser.username)
      .executeTakeFirst()
      if (result)
        throw new UnprocessableEntityException("Username already taken");
    } catch (error) {
      console.log(error);
      if (error instanceof UnprocessableEntityException)
        throw error;
      throw new InternalServerErrorException();
    }
    try {
      const hashedPassword = await bcrypt.hash(randomBytes(32), 10);
      await db
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
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  /**
   * Look for userId in the db
   * @param userId 
   * @returns AppUser
   * @throws InternalServerError
   * @throws NotFound
   */
  async getUserById(userId: number): Promise<AppUser> {
    let user: Selectable<User> | undefined;
    try {
      //? Fetch the databse and search for a user with userId
      user = await db
      .selectFrom('user')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!user)
      throw new NotFoundException();
    //? Create a AppUser containing every field, except password.
    const {password, ...appUserDB} = user;
    return {
      ...appUserDB,
      status: this.usersStatusGateway.getUserStatus(appUserDB?.id)
    };
  }

  /**
   * Looking for any user with a substring of there username that match the substring parameter.
   * @param substring 
   * @returns An array of User that match the substring
   * @throws InternalServerError
   * @throws NotFound
   */
  async findUsersByName(substring: string): Promise<AppUser[]> {
    //? Fetch the database and search for any user containing a substring in the username field.
    //? Create an array of AppUser containing every field except password of any user that matches the substring.
    let user: AppUserDB[]
    try {
      users = await db
      .selectFrom('user')
      .select(['username', 'bio', 'avatarUrl', 'firstname', 'lastname', 'createdAt', 'email', 'id', 'rating'])
      .where('username', 'like', '%' + substring + '%')
      .execute();
    }
    catch(error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!users)
      throw new NotFoundException();
    let appUsers: AppUser[] = [];
    user.forEach(user => {
      appUsers.push({
        ...user,
        status: this.usersStatusGateway.getUserStatus(user?.id)
      })
    })
    return appUsers;
  }

  /**
   * Return AppUser that match the username in the database.
   * @param username 
   * @returns AppUser
   * @throws InternalServerError
   * @throws NotFound
   */
  async getUserByName(username: string): Promise<AppUser> {
    let user: Selectable<User> | undefined;
    try {
      user = await db
      .selectFrom('user')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();
    }
    catch(error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!user)
      throw new NotFoundException();
    const {password, ...appUserDB} = user;
    return {
      ...appUserDB,
      status: this.usersStatusGateway.getUserStatus(appUserDB?.id)
    };
  }

  /**
   * Looking for a user matching the email string passed as parameter.
   * @param email 
   * @returns an AppUser
   * @throws NotFound if no user was found with this email
   * @throws InternalServerError if we fail to use the db.
   */
  async getUserByEmail(email: string): Promise<AppUser> {
    let user: AppUserDB | undefined;
    try {
      user = await db
      .selectFrom('user')
      .select(['avatarUrl', 'bio', 'createdAt', 'email', 'firstname', 'id', 'lastname', 'username', 'rating'])
      .where('email', '=', email)
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!user)
      throw new NotFoundException();
    return {
      ...user,
      status: this.usersStatusGateway.getUserStatus(user?.id)
    };
  }

  /**
   * Look for the username in the db, compare the password, return user,
   * without password if the password match.
   * @param name 
   * @param pass 
   * @returns AppUser
   * @throws Unauthorized
   * @throws InternalServerError
   */
  async validateUser(name: string, pass: string): Promise<AppUser> {
    try {
      const user = await db
      .selectFrom('user')
      .selectAll()
      .where('username', '=', name)
      .executeTakeFirst();
      if (!user)
        throw new NotFoundException();

      const result = await bcrypt.compare(pass, user.password);
      if (!result)
        throw new UnauthorizedException();

      const {password, ...appUserDB} = user;
      return {
        ...appUserDB,
        status: this.usersStatusGateway.getUserStatus(appUserDB?.id)
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException)
        throw new UnauthorizedException;
      throw new InternalServerErrorException();
    }
  }

  /**
   * Get every user in the database.
   * @returns An array of ListUsers
   * @throws InternalServerError
   */
  async getUserList(): Promise<ListUsers[]> {
    try {
      let userList: ListUsers[] = await db
      .selectFrom('user')
      .select(['id', 'username', 'avatarUrl'])
      .execute();
      return userList;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async updateUser(userId: number, updateUsersDto: UpdateUsersDto) {
    if (updateUsersDto.bio || updateUsersDto.firstname || updateUsersDto.lastname) {
      try {
        const result = await db
        .updateTable('user')
        .set({...updateUsersDto})
        .where('id', '=', userId)
        .executeTakeFirst()
      } catch (error) {
        console.log(error);
        throw new InternalServerErrorException();
      }
    }
    else
      throw new UnprocessableEntityException("Empty value");
  }
}

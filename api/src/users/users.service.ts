import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { db } from 'src/database';
import { CreateUsersDto } from './dto/create-users.dto';
import * as bcrypt from 'bcrypt';
import {
  AppUser,
  AppUserDB,
  ListUsers,
  UserSearchResult,
} from 'src/types/clientSchema';
import { userFromIntra } from 'src/auth/oauth.strategy';
import { randomBytes } from 'crypto';
import { User } from 'src/types/schema';
import { Selectable } from 'kysely';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';
import { unlink } from 'fs/promises';
import { UpdateUsersDto } from './dto/update-users.dto';

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
    if (createUsersDto.username == '' || !createUsersDto.username) {
      console.log('Tried to register without a username');
      throw new UnprocessableEntityException('Empty username');
    }
    try {
      const result = await db
        .selectFrom('user')
        .selectAll()
        .where('username', '=', createUsersDto.username)
        .executeTakeFirst();
      if (result)
        throw new UnprocessableEntityException('Username already taken');
    } catch (error) {
      if (error instanceof UnprocessableEntityException) throw error;
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
          lastname: createUsersDto.lastname,
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
        .select([
          'avatarUrl',
          'bio',
          'createdAt',
          'email',
          'firstname',
          'id',
          'lastname',
          'rating',
          'username',
          'isTwoFactorAuthenticationEnabled',
        ])
        .where('username', '=', createUsersDto.username)
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    return {
      ...userDB,
      status: this.usersStatusGateway.getUserStatus(userDB?.id),
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
        .executeTakeFirst();
      if (result)
        throw new UnprocessableEntityException('Username already taken');
    } catch (error) {
      console.log(error);
      if (error instanceof UnprocessableEntityException) throw error;
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
          password: hashedPassword,
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
    if (!user) throw new NotFoundException();
    //? Create a AppUser containing every field, except password.
    const { password, TwoFactorAuthenticationSecret, ...appUserDB } = user;
    return {
      ...appUserDB,
      status: this.usersStatusGateway.getUserStatus(appUserDB?.id),
    };
  }

  async findUsersByName(
    userId: number,
    substring: string,
  ): Promise<UserSearchResult[]> {
    try {
      const users = await db
        .selectFrom('user')
        .where('user.id', '!=', userId)
        .where('username', 'like', '%' + substring + '%')
        // don't select blocked users
        .leftJoin('blockedUser', (join) =>
          join.on((eb) =>
            eb.or([
              eb.and([
                eb('blockedById', '=', userId),
                eb('blockedId', '=', eb.ref('user.id')),
              ]),
              eb.and([
                eb('blockedId', '=', userId),
                eb('blockedById', '=', eb.ref('user.id')),
              ]),
            ]),
          ),
        )
        .where('blockedId', 'is', null)

        // select isFriends
        .leftJoin('friend', (join) =>
          join.on((eb) =>
            eb.or([
              eb.and([
                eb('friend.user1_id', '=', userId),
                eb('friend.user2_id', '=', eb.ref('user.id')),
              ]),
              eb.and([
                eb('friend.user2_id', '=', userId),
                eb('friend.user1_id', '=', eb.ref('user.id')),
              ]),
            ]),
          ),
        )
        .select((eb) =>
          eb
            .case()
            .when('friend.user1_id', 'is', null)
            .then(false)
            .else(true)
            .end()
            .as('isFriends'),
        )

        .leftJoin('friendRequest', (join) =>
          join.on((eb) =>
            eb.or([
              eb.and([
                eb('friendRequest.sourceId', '=', userId),
                eb('friendRequest.targetId', '=', eb.ref('user.id')),
              ]),
              eb.and([
                eb('friendRequest.targetId', '=', userId),
                eb('friendRequest.sourceId', '=', eb.ref('user.id')),
              ]),
            ]),
          ),
        )
        .select('friendRequest.sourceId as friendRequestSourceUserId')

        // select conversation id
        .leftJoin('conversation', (join) =>
          join.on((eb) =>
            eb.or([
              eb.and([
                eb('conversation.user1_id', '=', userId),
                eb('conversation.user2_id', '=', eb.ref('user.id')),
              ]),
              eb.and([
                eb('conversation.user2_id', '=', userId),
                eb('conversation.user1_id', '=', eb.ref('user.id')),
              ]),
            ]),
          ),
        )
        .select('conversation.id as conversationId')

        .select(['username', 'user.avatarUrl', 'user.id', 'rating'])
        .execute();

      return users.map((u) => ({
        ...u,
        status: this.usersStatusGateway.getUserStatus(u.id),
      }));
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
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
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!user) throw new NotFoundException();
    const { password, TwoFactorAuthenticationSecret, ...appUserDB } = user;
    return {
      ...appUserDB,
      status: this.usersStatusGateway.getUserStatus(appUserDB?.id),
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
        .select([
          'avatarUrl',
          'bio',
          'createdAt',
          'email',
          'firstname',
          'id',
          'lastname',
          'username',
          'rating',
          'isTwoFactorAuthenticationEnabled',
        ])
        .where('email', '=', email)
        .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!user) throw new NotFoundException();
    return {
      ...user,
      status: this.usersStatusGateway.getUserStatus(user?.id),
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
      if (!user) throw new NotFoundException();

      const result = await bcrypt.compare(pass, user.password);
      if (!result) throw new UnauthorizedException();

      const { password, TwoFactorAuthenticationSecret, ...appUserDB } = user;
      return {
        ...appUserDB,
        status: this.usersStatusGateway.getUserStatus(appUserDB?.id),
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      )
        throw new UnauthorizedException();
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
    if (
      !updateUsersDto.bio &&
      !updateUsersDto.username &&
      !updateUsersDto.firstname &&
      !updateUsersDto.lastname
    )
      return;
    if (!updateUsersDto.username)
      throw new UnprocessableEntityException('Username is empty');
    try {
      if (updateUsersDto.username) {
        const user = await db
          .selectFrom('user')
          .selectAll()
          .where(({ eb, and }) =>
            and([
              eb('username', '=', updateUsersDto.username as string),
              eb('id', '!=', userId),
            ]),
          )
          .executeTakeFirst();
        if (user)
          throw new UnprocessableEntityException('Username already taken');
      }
      const result = await db
        .updateTable('user')
        .set({ ...updateUsersDto })
        .where('id', '=', userId)
        .executeTakeFirst();
    } catch (error) {
      console.log(error);
      if (error instanceof UnprocessableEntityException) throw error;
      throw new InternalServerErrorException();
    }
  }

  /**
   * Set the URL avatar for the user
   * @param userId
   * @param avatarUrl
   */
  async setAvatar(userId: number, avatarUrl: string): Promise<AppUser> {
    try {
      const result = await db
        .selectFrom('user')
        .select('avatarUrl')
        .where('id', '=', userId)
        .executeTakeFirst();
      try {
        if (
          result != undefined &&
          result.avatarUrl != null &&
          result.avatarUrl.includes(`/api/users`, 0)
        ) {
          await unlink(result.avatarUrl.replace(`/api/users/`, 'public/'));
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }

    try {
      const result = await db
        .updateTable('user')
        .set('avatarUrl', avatarUrl.replace('public/', ''))
        .where('user.id', '=', userId)
        .executeTakeFirst();
      const user = await db
        .selectFrom('user')
        .selectAll()
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      const { password, TwoFactorAuthenticationSecret, ...appUserDB } = user;
      return {
        ...appUserDB,
        status: this.usersStatusGateway.getUserStatus(appUserDB?.id),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Set secret in the table user, for the matching user id
   * @param userId
   * @param secret
   */
  async setTwoFactorAuthenticationSecret(userId: number, secret: string) {
    try {
      await db
        .updateTable('user')
        .set('TwoFactorAuthenticationSecret', secret)
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Return secret matching userID
   * @param userId
   * @returns
   * @throws NotFoundException
   * @throws InternatServerErrorException
   */
  async getTwoFactorAuthenticationSecret(userId: number): Promise<string> {
    let res:
      | {
          TwoFactorAuthenticationSecret: string | null;
        }
      | undefined;
    try {
      res = await db
        .selectFrom('user')
        .select('TwoFactorAuthenticationSecret')
        .where('id', '=', userId)
        .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!res || !res.TwoFactorAuthenticationSecret)
      throw new NotFoundException();
    return res.TwoFactorAuthenticationSecret;
  }

  /**
   * Set bool to true when turning 2FA on
   * @param userId
   */
  async turnOnTwoFactorAuthentication(userId: number) {
    try {
      await db
        .updateTable('user')
        .set('isTwoFactorAuthenticationEnabled', true)
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserProfile(currentUserId: number, userId: number) {
    const user = await db
      .selectFrom('user')
      .where('user.id', '=', userId)
      .select([
        'avatarUrl',
        'bio',
        'user.createdAt',
        'email',
        'firstname',
        'user.id',
        'lastname',
        'username',
        'rating',
      ])

      // Select if user is blocking the current user
      .leftJoin('blockedUser as isBlocking', (join) =>
        join.on((eb) =>
          eb.and([
            eb('isBlocking.blockedById', '=', userId),
            eb('isBlocking.blockedId', '=', currentUserId),
          ]),
        ),
      )
      .select((eb) =>
        eb
          .case()
          .when('isBlocking.blockedId', 'is', null)
          .then(false)
          .else(true)
          .end()
          .as('isBlocking'),
      )

      // Select if current user is blocking the user
      .leftJoin('blockedUser as isBlocked', (join) =>
        join.on((eb) =>
          eb.and([
            eb('isBlocked.blockedById', '=', currentUserId),
            eb('isBlocked.blockedId', '=', userId),
          ]),
        ),
      )
      .select((eb) =>
        eb
          .case()
          .when('isBlocked.blockedId', 'is', null)
          .then(false)
          .else(true)
          .end()
          .as('isBlocked'),
      )

      // Select if they are friends
      .leftJoin('friend', (join) =>
        join.on((eb) =>
          eb
            .and([
              eb('friend.user1_id', '=', userId),
              eb('friend.user2_id', '=', currentUserId),
            ])
            .or(
              eb.and([
                eb('friend.user1_id', '=', currentUserId),
                eb('friend.user2_id', '=', userId),
              ]),
            ),
        ),
      )
      .select((eb) =>
        eb
          .case()
          .when('friend.user1_id', 'is', null)
          .then(false)
          .else(true)
          .end()
          .as('isFriends'),
      )

      // Select the (potential) friend request source id
      .leftJoin('friendRequest', (join) =>
        join.on((eb) =>
          eb.or([
            eb.and([
              eb('friendRequest.sourceId', '=', currentUserId),
              eb('friendRequest.targetId', '=', userId),
            ]),
            eb.and([
              eb('friendRequest.sourceId', '=', userId),
              eb('friendRequest.targetId', '=', currentUserId),
            ]),
          ]),
        ),
      )
      .select('friendRequest.sourceId as friendRequestSourceUserId')

      // Select the (potential) conversation id
      .leftJoin('conversation', (join) =>
        join.on((eb) =>
          eb.or([
            eb.and([
              eb('conversation.user1_id', '=', currentUserId),
              eb('conversation.user2_id', '=', userId),
            ]),
            eb.and([
              eb('conversation.user1_id', '=', userId),
              eb('conversation.user2_id', '=', currentUserId),
            ]),
          ]),
        ),
      )
      .select('conversation.id as conversationId')
      .executeTakeFirst();

    if (user) {
      return {
        ...user,
        status: this.usersStatusGateway.getUserStatus(user.id),
      };
    }
    return user;
  }
}

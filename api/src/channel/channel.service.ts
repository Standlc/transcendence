import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { db } from 'src/database';
import {
  ChannelBannedUser,
  ChannelCreationData,
  ChannelDataWithUsersWithoutPassword,
  ChannelJoinDto,
  ChannelUpdate,
  EligibleUserForChannel,
  MessageWithSenderInfo,
  PublicChannel,
  UserChannel,
} from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';
import { Utils } from './utilsChannel.service';
import { unlink } from 'fs/promises';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';
import { sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { ChannelGateway } from './channel.gateway';

@Injectable()
export class ChannelService {
  constructor(
    private readonly utilsChannelService: Utils,
    private readonly usersStatusGateway: UsersStatusGateway,
    private readonly channelsGateway: ChannelGateway,
  ) {}

  async setPhoto(
    userId: number,
    channelId: number,
    path: string,
  ): Promise<string> {
    const isUserAdmin = await this.canUserUpdateChannel(userId, channelId);
    if (!isUserAdmin) throw new ForbiddenException();

    try {
      const result = await db
        .selectFrom('channel')
        .select('photoUrl')
        .where('id', '=', channelId)
        .executeTakeFirst();
      try {
        if (
          result != undefined &&
          result.photoUrl != null &&
          result.photoUrl.includes(`/api/channels`, 0)
        ) {
          await unlink(
            result.photoUrl.replace(`/api/channels/photo`, 'public/channels/'),
          );
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }

    try {
      await db
        .updateTable('channel')
        .set('photoUrl', path.replace('public/channels/', 'photo/'))
        .where('channel.id', '=', channelId)
        .executeTakeFirst();

      const channelMembers = await this.getChannelMembers(channelId);
      this.channelsGateway.emitChannelUpdated(channelId, channelMembers);
      return path;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getChannelMessages(
    userId: number,
    channelId: number,
  ): Promise<MessageWithSenderInfo[]> {
    if ((await this.isUserMember(userId, channelId)) === false) {
      throw new NotFoundException('User is not a member of the channel');
    }

    try {
      const messages = await db
        .selectFrom('channelMessage')
        .where('channelMessage.channelId', '=', channelId)
        .innerJoin('channelMember', (join) =>
          join.on((eb) =>
            eb.and([
              eb('channelMember.channelId', '=', channelId),
              eb('channelMember.userId', '=', userId),
            ]),
          ),
        )
        .innerJoin('user', 'channelMessage.senderId', 'user.id')
        .leftJoin('blockedUser', (join) =>
          join.on((eb) =>
            eb.and([
              eb('blockedId', '=', eb.ref('channelMessage.senderId')),
              eb('blockedById', '=', userId),
            ]),
          ),
        )
        .select([
          'user.avatarUrl',
          'user.username',
          'user.id as senderId',
          'channelMessage.content as messageContent',
          'channelMessage.createdAt',
          'channelMessage.id',
          (eb) =>
            eb
              .case()
              .when('blockedId', 'is not', null)
              .then(true)
              .else(false)
              .end()
              .as('isBlocked'),
        ])
        .orderBy('channelMessage.createdAt', 'asc')
        .execute();

      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new InternalServerErrorException();
    }
  }

  async createChannel(
    payload: ChannelCreationData,
    userId: number,
  ): Promise<number> {
    if (payload.memberIds.length) {
      const checkFriends = await db
        .selectFrom('friend')
        .where((eb) =>
          eb.or([
            eb.and([
              eb('friend.user1_id', '=', userId),
              eb('friend.user2_id', 'in', payload.memberIds),
            ]),
            eb.and([
              eb('friend.user2_id', '=', userId),
              eb('friend.user1_id', 'in', payload.memberIds),
            ]),
          ]),
        )
        .execute();

      if (checkFriends.length !== payload.memberIds.length) {
        throw new ForbiddenException();
      }
    }

    let hashedPassword: string | undefined = undefined;
    if (payload.password) {
      hashedPassword = await this.hashPassword(payload.password);
    }

    const newChannel = await db
      .insertInto('channel')
      .values({
        channelOwner: userId,
        isPublic: hashedPassword ? true : payload.isPublic,
        name: payload.name,
        password: hashedPassword ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await db
      .insertInto('channelMember')
      .values({
        channelId: newChannel.id,
        userId,
        isAdmin: true,
      })
      .execute();

    if (payload.memberIds.length) {
      await db
        .insertInto('channelMember')
        .values(
          payload.memberIds.map((id) => {
            return {
              channelId: newChannel.id,
              userId: id,
            };
          }),
        )
        .execute();
    }

    this.channelsGateway.emitNewChannel(newChannel.id, payload.memberIds);
    return newChannel.id;
  }

  async deleteChannel(channelId: number) {
    try {
      const channel = await db
        .selectFrom('channel')
        .select((eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('channelMember')
              .where('channelMember.channelId', '=', channelId)
              .select('channelMember.userId as id'),
          ).as('members'),
        )
        .select('photoUrl')
        .where('id', '=', channelId)
        .executeTakeFirst(); //Recupere photoUrl

      if (!channel) {
        throw new NotFoundException();
      }

      if (channel.photoUrl) {
        await unlink(
          channel.photoUrl.replace(`/api/channels/photo`, 'public/channels/'),
        ); //Unlink permet de faire comme la commande `rm`
      }

      await db.deleteFrom('channel').where('id', '=', channelId).execute();

      this.channelsGateway.emitChannelDelete(
        Number(channelId),
        channel.members.map((m) => m.id),
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async updateChannel(channelId: number, payload: ChannelUpdate) {
    console.log(payload);
    let hashedPassword: string | undefined = undefined;
    if (payload.password) {
      hashedPassword = await this.hashPassword(payload.password);
    }
    const channelPrevData = await db
      .selectFrom('channel')
      .where('channel.id', '=', channelId)
      .selectAll()
      .executeTakeFirst();
    if (!channelPrevData) {
      throw new NotFoundException();
    }

    const isPublic = () => {
      if (hashedPassword !== undefined) {
        return true;
      }
      if (payload.isPublic !== undefined) {
        return payload.isPublic;
      }
      return payload.isPublic;
    };

    const updatedChannel = await db
      .updateTable('channel')
      .where('channel.id', '=', channelId)
      .set({
        password:
          payload.password === null
            ? null
            : hashedPassword ?? channelPrevData.password,
        isPublic: isPublic(),
        name: payload.name,
      })
      .execute();

    const channelMembers = await this.getChannelMembers(channelId);
    this.channelsGateway.emitChannelUpdated(channelId, channelMembers);
  }

  async getChannelMembers(channelId: number) {
    const members = await db
      .selectFrom('channelMember')
      .where('channelId', '=', channelId)
      .select('channelMember.userId as id')
      .execute();

    return members.map((u) => u.id);
  }

  async getChannel(
    userId: number,
    channelId: number,
  ): Promise<ChannelDataWithUsersWithoutPassword> {
    const channel = await db
      .selectFrom('channel')
      .where('channel.id', '=', channelId)
      .select([
        'channelOwner',
        'createdAt',
        'id',
        'isPublic',
        'name',
        'photoUrl',
        (eb) =>
          eb
            .case()
            .when('channel.password', 'is not', null)
            .then(true)
            .else(false)
            .end()
            .as('isProtected'),
        (eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('channelMember')
              .where('channelMember.channelId', '=', channelId)
              .innerJoin('user', 'user.id', 'channelMember.userId')
              .select([
                'user.id as userId',
                'user.username',
                'user.avatarUrl',
                'user.rating',
                'channelMember.mutedEnd',
                'channelMember.isAdmin',
                (eb) =>
                  eb
                    .exists((eb) =>
                      eb
                        .selectFrom('blockedUser')
                        .where((eb) =>
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
                    .as('isBlocked'),
              ])
              .orderBy('channelMember.isAdmin', 'desc'),
          ).as('users'),
      ])
      .executeTakeFirst();

    if (!channel) {
      throw new NotFoundException();
    }

    return {
      ...channel,
      users: channel.users.map((user) => {
        return {
          ...user,
          status: this.usersStatusGateway.getUserStatus(user.userId),
        };
      }),
    };
  }

  async getEligibleUsersForChannel(
    adminId: number,
    channelId: number,
  ): Promise<EligibleUserForChannel[]> {
    const users = await db
      .selectFrom('user')
      .innerJoin('channelMember as admin', (join) =>
        join
          .on('admin.channelId', '=', channelId)
          .on('admin.userId', '=', adminId)
          .on('admin.isAdmin', 'is', true),
      )
      // select only friends
      .innerJoin('friend', (join) =>
        join.on((eb) =>
          eb.or([
            eb.and([
              eb('friend.user1_id', '=', adminId),
              eb('friend.user2_id', '=', eb.ref('user.id')),
            ]),
            eb.and([
              eb('friend.user2_id', '=', adminId),
              eb('friend.user1_id', '=', eb.ref('user.id')),
            ]),
          ]),
        ),
      )
      // don't select current members
      .leftJoin('channelMember', (join) =>
        join
          .onRef('channelMember.userId', '=', 'user.id')
          .on('channelMember.channelId', '=', channelId),
      )
      .where('channelMember.userId', 'is', null)
      // don't select banned users
      .leftJoin('bannedUser', (join) =>
        join
          .onRef('bannedUser.bannedId', '=', 'user.id')
          .on('bannedUser.channelId', '=', channelId),
      )
      .where('bannedUser.bannedId', 'is', null)
      .select(['user.username', 'user.rating', 'user.id', 'user.avatarUrl'])
      .execute();

    return users;
  }

  async getBannedUsersFromChannel(
    channelId: number,
  ): Promise<ChannelBannedUser[]> {
    const bannedUsers = await db
      .selectFrom('bannedUser')
      .where('channelId', '=', channelId)
      .innerJoin('user', 'user.id', 'bannedId')
      .select(['user.id', 'user.username', 'user.rating', 'user.avatarUrl'])
      .execute();

    return bannedUsers;
  }

  async getAllChannelsOfTheUser(userId: number): Promise<UserChannel[]> {
    const channels = await db
      .selectFrom('channelMember')
      .where('userId', '=', userId)
      .innerJoin('channel', 'channel.id', 'channelMember.channelId')
      .select([
        'channel.id',
        'channel.isPublic',
        'channel.channelOwner as ownerId',
        'channel.name',
        'channel.photoUrl',
        (eb) =>
          eb
            .case()
            .when('channelMember.isAdmin', 'is', true)
            .then(true)
            .else(false)
            .end()
            .as('isUserAdmin'),
        (eb) =>
          eb
            .case()
            .when('channel.password', 'is not', null)
            .then(true)
            .else(false)
            .end()
            .as('isProtected'),
      ])
      .orderBy('createdAt desc')
      .execute();
    return channels;
  }

  async getAllPublicChannels(userId: number): Promise<PublicChannel[]> {
    return await db
      .selectFrom('channel')
      .where('channel.isPublic', 'is', true)
      .leftJoin('bannedUser', (join) =>
        join.on((eb) =>
          eb.and([
            eb('bannedUser.channelId', '=', eb.ref('channel.id')),
            eb('bannedUser.bannedId', '=', userId),
          ]),
        ),
      )
      .where('bannedId', 'is', null)
      .select((eb) =>
        eb
          .selectFrom('channelMember')
          .select(eb.fn.countAll<number>().as('membersCount'))
          .whereRef('channelMember.channelId', '=', 'channel.id')
          .as('membersCount'),
      )
      .leftJoin('channelMember as user', (join) =>
        join
          .on('user.userId', '=', userId)
          .onRef('user.channelId', '=', 'channel.id'),
      )
      .select((eb) =>
        eb
          .case()
          .when('user.userId', 'is', null)
          .then(false)
          .else(true)
          .end()
          .as('isMember'),
      )
      .select((eb) =>
        eb
          .case()
          .when('channel.password', 'is not', null)
          .then(true)
          .else(false)
          .end()
          .as('isProtected'),
      )
      .select(['channel.id', 'channel.name', 'channel.photoUrl'])
      .orderBy('channel.createdAt desc')
      .execute();
  }

  async removeMemberFromChannel(userId: number, channelId: number) {
    await db
      .deleteFrom('channelMember')
      .where('channelId', '=', channelId)
      .where('userId', '=', userId)
      .execute();

    this.channelsGateway.emitUserLeave({ userId, channelId });
  }

  async banUser(currentUserId: number, userId: number, channelId: number) {
    await this.removeMemberFromChannel(userId, channelId);

    await db
      .insertInto('bannedUser')
      .values({
        bannedById: currentUserId,
        bannedId: userId,
        channelId: channelId,
      })
      .execute();

    this.channelsGateway.emitUserBanned({ userId, channelId });
  }

  async unbanUser(userId: number, channelId: number) {
    await db
      .deleteFrom('bannedUser')
      .where('bannedUser.bannedId', '=', userId)
      .where('channelId', '=', channelId)
      .execute();

    this.channelsGateway.emitUserUnbanned({ userId, channelId });
  }

  async muteMember(userId: number, channelId: number) {
    await db
      .updateTable('channelMember')
      .where('channelId', '=', channelId)
      .where('userId', '=', userId)
      .set({
        mutedEnd: sql`now() + interval '1 minute 10s'`,
      })
      .execute();

    this.channelsGateway.emitMemberMuted({ userId, channelId });
  }

  async joinUserToChannel(userId: number, channelId: number) {
    await db
      .insertInto('channelMember')
      .values({ channelId, userId })
      .executeTakeFirstOrThrow();

    this.channelsGateway.emitUserJoined({ userId, channelId });
  }

  async changeMemberAdmin(
    userId: number,
    channelId: number,
    makeAdmin: boolean,
  ) {
    await db
      .updateTable('channelMember')
      .where('userId', '=', userId)
      .where('channelId', '=', channelId)
      .set({
        isAdmin: makeAdmin,
      })
      .execute();

    if (makeAdmin) {
      this.channelsGateway.emitNewAdmin({ userId, channelId });
    } else {
      this.channelsGateway.emitAdminRemove({ userId, channelId });
    }
  }

  // UTILS

  async hashPassword(password: string) {
    if (password.length === 0) {
      throw new BadRequestException();
    }
    return await bcrypt.hash(password, 10);
  }

  selectAdminQuery(userId: number, channelId: number) {
    return db
      .selectFrom('channelMember as admin')
      .where('admin.userId', '=', userId)
      .where('admin.channelId', '=', channelId)
      .where('admin.isAdmin', 'is', true);
  }

  selectAdminAndTargetMemberQuery(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    return this.selectAdminQuery(currentUserId, channelId)
      .innerJoin('channel', 'channel.id', 'admin.channelId')
      .innerJoin('channelMember as targetUser', (join) =>
        join
          .on('targetUser.userId', '=', userId)
          .on('targetUser.channelId', '=', channelId),
      )
      .whereRef('targetUser.userId', '!=', 'channel.channelOwner')
      .whereRef('admin.userId', '!=', 'targetUser.userId');
  }

  async checkCanUserJoinChannel(userId: number, payload: ChannelJoinDto) {
    const channel = await db
      .selectFrom('channel')
      .where('channel.id', '=', payload.channelId)
      .where('channel.isPublic', 'is', true)
      .leftJoin('bannedUser', (join) =>
        join.on((eb) =>
          eb.and([
            eb('bannedUser.channelId', '=', eb.ref('channel.id')),
            eb('bannedUser.bannedId', '=', userId),
          ]),
        ),
      )
      .where('bannedId', 'is', null)
      .leftJoin('channelMember', (join) =>
        join.on((eb) =>
          eb.and([
            eb('channelMember.userId', '=', userId),
            eb('channelMember.channelId', '=', payload.channelId),
          ]),
        ),
      )
      .where('channelMember.userId', 'is', null)
      .select(['channel.id', 'channel.password'])
      .executeTakeFirst();

    if (channel?.password) {
      const isMatch = await bcrypt.compare(
        payload.password ?? '',
        channel.password,
      );
      return isMatch;
    }
    return channel?.id ? true : false;
  }

  async canUserBeAdmin(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    const member = await this.selectAdminAndTargetMemberQuery(
      currentUserId,
      userId,
      channelId,
    )
      .where('targetUser.isAdmin', 'is', false)
      .executeTakeFirst();
    return !!member;
  }

  async canUserBeNotAdmin(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    const member = await this.selectAdminAndTargetMemberQuery(
      currentUserId,
      userId,
      channelId,
    )
      .where('targetUser.isAdmin', 'is', true)
      .executeTakeFirst();
    return !!member;
  }

  async canUserUpdateChannel(
    userId: number,
    channelId: number,
  ): Promise<boolean> {
    const channel = await this.selectAdminQuery(userId, channelId)
      .innerJoin('channel', 'channel.id', 'admin.channelId')
      .where('channel.channelOwner', '=', userId)
      .executeTakeFirst();
    return !!channel;
  }

  async canUserDeleteChannel(
    userId: number,
    channelId: number,
  ): Promise<boolean> {
    const channel = await db
      .selectFrom('channel')
      .where('id', '=', channelId)
      .where('channelOwner', '=', userId)
      .executeTakeFirst();
    return !!channel;
  }

  async canUserBeMuted(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    const member = await this.selectAdminAndTargetMemberQuery(
      currentUserId,
      userId,
      channelId,
    )
      .where((eb) =>
        eb
          .case()
          .when('targetUser.mutedEnd', 'is not', null)
          .then(eb('targetUser.mutedEnd', '<', new Date()))
          .else(true)
          .end(),
      )
      .executeTakeFirst();
    return !!member;
  }

  async canUserBeKicked(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    const member = await this.selectAdminAndTargetMemberQuery(
      currentUserId,
      userId,
      channelId,
    ).executeTakeFirst();
    return !!member;
  }

  async canUserBanUser(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    const member = await this.selectAdminAndTargetMemberQuery(
      currentUserId,
      userId,
      channelId,
    )
      .leftJoin('bannedUser', (join) =>
        join
          .on('bannedId', '=', userId)
          .on('bannedUser.channelId', '=', channelId),
      )
      .where('bannedId', 'is', null)
      .executeTakeFirst();
    return !!member;
  }

  async canUserBeUnbanned(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    const bannedUser = await this.selectAdminQuery(currentUserId, channelId)
      .innerJoin('bannedUser', (join) =>
        join
          .on('bannedId', '=', userId)
          .on('bannedUser.channelId', '=', channelId),
      )
      .executeTakeFirst();
    return !!bannedUser;
  }

  async canUserLeaveChannel(userId: number, channelId: number) {
    const member = await db
      .selectFrom('channelMember')
      .where('channelMember.userId', '=', userId)
      .where('channelId', '=', channelId)
      .innerJoin('channel', 'channel.id', 'channelMember.channelId')
      .where('channel.channelOwner', '!=', userId)
      .executeTakeFirst();
    return !!member;
  }

  async canUserAddMember(
    currentUserId: number,
    userId: number,
    channelId: number,
  ) {
    const isAllowed = await this.selectAdminQuery(currentUserId, channelId)
      // select where the user is not a member of the channel
      .leftJoin('channelMember', (join) =>
        join
          .on('channelMember.userId', '=', userId)
          .on('channelMember.channelId', '=', channelId),
      )
      .where('channelMember.userId', 'is', null)
      // select where the user is not banned from the channel
      .leftJoin('bannedUser', (join) =>
        join
          .on('bannedUser.bannedId', '=', userId)
          .on('bannedUser.channelId', '=', channelId),
      )
      .where('bannedUser.bannedById', 'is', null)
      .executeTakeFirst();

    return !!isAllowed;
  }

  async removeMember(memberId: number, channelId: number) {
    await db
      .deleteFrom('channelMember')
      .where('channelMember.userId', '=', memberId)
      .where('channelMember.channelId', '=', channelId)
      .execute();
  }

  async isUserMember(userId: number, channelId: number) {
    const isMember = await db
      .selectFrom('channel')
      .where('channel.id', '=', channelId)
      .innerJoin('channelMember as m', (join) =>
        join
          .onRef('m.channelId', '=', 'channel.id')
          .on('m.userId', '=', userId),
      )
      .executeTakeFirst();

    return !!isMember;
  }
}

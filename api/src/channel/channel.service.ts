import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { db } from 'src/database';
import {
  ChannelCreationData,
  ChannelDataWithUsersWithoutPassword,
  ChannelJoinDto,
  ChannelUpdate,
  ChannelWithoutPsw,
  MessageWithSenderInfo,
  PublicChannel,
  UserChannel,
} from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';
import { Utils } from './utilsChannel.service';
import { unlink } from 'fs/promises';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';

@Injectable()
export class ChannelService {
  constructor(
    private readonly utilsChannelService: Utils,
    private readonly usersStatusGateway: UsersStatusGateway,
  ) {}

  async setPhoto(
    userId: number,
    channelId: number,
    path: string,
  ): Promise<ChannelWithoutPsw> {
    // ? Check if user is Admin Owner
    if (
      !(await this.utilsChannelService.userIsAdmin(userId, channelId)) &&
      !(await this.utilsChannelService.userIsOwner(userId, channelId))
    ) {
      await unlink(path.replace('/api/channels/', ''));
      throw new UnprocessableEntityException(
        'user is not channel admin nor owner',
      );
    }

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
      const result = await db
        .updateTable('channel')
        .set('photoUrl', path.replace('public/channels/', 'photo/'))
        .where('channel.id', '=', channelId)
        .executeTakeFirst();
      const channel = await db
        .selectFrom('channel')
        .selectAll()
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();
      const { password, ...channelWithoutPsw } = channel;
      return channelWithoutPsw;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getChannelMessages(
    userId: number,
    channelId: number,
  ): Promise<MessageWithSenderInfo[]> {
    try {
      await this.utilsChannelService.channelExists(channelId);
    } catch (error) {
      throw error;
    }

    if (
      (await this.utilsChannelService.isChannelMember(userId, channelId)) ===
      false
    ) {
      throw new NotFoundException('User is not a member of the channel');
    }

    try {
      await this.utilsChannelService.userIsBanned(userId, channelId);
    } catch (error) {
      throw error;
    }

    try {
      const messages = await db
        .selectFrom('channelMessage')
        .selectAll()
        .where('channelMessage.channelId', '=', channelId)
        .orderBy('channelMessage.createdAt', 'asc')
        .leftJoin('user', 'channelMessage.senderId', 'user.id')
        .leftJoin(
          'channelAdmin',
          'channelAdmin.channelId',
          'channelMessage.channelId',
        )
        .leftJoin('channel', 'channel.channelOwner', 'channelMessage.senderId')
        .leftJoin(
          'bannedUser',
          'bannedUser.bannedId',
          'channelMessage.senderId',
        )
        .leftJoin('mutedUser', (join) =>
          join
            .onRef('mutedUser.userId', '=', 'channelMessage.senderId')
            .on('mutedUser.channelId', '=', channelId)
            .on('mutedUser.mutedEnd', '>', new Date()),
        )
        .leftJoin('blockedUser', (join) =>
          join
            .onRef('blockedUser.blockedId', '=', 'channelMessage.senderId')
            .on('blockedUser.blockedById', '=', userId),
        )
        .select([
          'channelMessage.channelId',
          'channelMessage.content',
          'channelMessage.createdAt',
          'channelMessage.id as messageId',
          'channelMessage.senderId',
          'user.avatarUrl',
          'user.username',
          'channelAdmin.userId as isAdmin',
          'bannedUser.bannedId as isBanned',
          'mutedUser.userId as isMuted',
          'mutedUser.mutedEnd',
          'channel.channelOwner',
          'blockedUser.blockedId',
        ])
        .execute();

      const result: MessageWithSenderInfo[] = messages.map((message) => ({
        channelId: message.channelId,
        messageContent: message.content,
        createdAt: message.createdAt as Date,
        messageId: message.messageId as number,
        senderId: message.senderId,
        isOwner: message.channelOwner !== null,
        isAdmin: message.isAdmin !== null,
        isBanned: message.isBanned !== null,
        isMuted: message.isMuted !== null,
        mutedEnd: message.mutedEnd,
        avatarUrl: message.avatarUrl,
        username: message.username || 'no username',
        senderIsBlocked: Boolean(message.blockedId),
      })) as MessageWithSenderInfo[];

      return result as MessageWithSenderInfo[];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async createChannel(
    payload: ChannelCreationData,
    userId: number,
  ): Promise<number> {
    // const existingChannel = await db.selectFrom("channel").where("channel.name", "=", payload.name).executeTakeFirst();
    // if (!!existingChannel) {
    //   throw new ConflictException();
    // }

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
      if (payload.password.length === 0) {
        throw new BadRequestException();
      }
      hashedPassword = await bcrypt.hash(payload.password, 10);
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
      })
      .execute();

    await db
      .insertInto('channelAdmin')
      .values({
        channelId: newChannel.id,
        userId,
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

    return newChannel.id;
  }

  //
  //
  //
  async deleteChannel(channelId: number, userId: number): Promise<string> {
    try {
      await this.utilsChannelService.channelExists(channelId);
    } catch (error) {
      throw error;
    }

    if (
      (await this.utilsChannelService.userIsOwner(userId, channelId)) === false
    ) {
      throw new UnauthorizedException('Only the owner can delete the channel');
    }

    try {
      await db.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('channelAdmin')
          .where('channelId', '=', channelId)
          .execute();
        await trx
          .deleteFrom('channelMember')
          .where('channelId', '=', channelId)
          .execute();
        await trx.deleteFrom('channel').where('id', '=', channelId).execute();
      });

      // Delete photo
      const photoUrl = await db
        .selectFrom('channel')
        .select('photoUrl')
        .where('id', '=', channelId)
        .executeTakeFirst(); //Recupere photoUrl
      if (photoUrl && photoUrl.photoUrl) {
        await unlink(
          photoUrl.photoUrl.replace(`/api/channels/photo`, 'public/channels/'),
        ); //Unlink permet de faire comme la commande `rm`
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return `Channel ${channelId} deleted`;
  }

  //
  //
  //
  async updateChannel(
    channelId: number,
    channel: ChannelUpdate,
    userId: number,
  ): Promise<string> {
    try {
      this.utilsChannelService.dataCanBeUpdated(channel);
    } catch (error) {
      throw error;
    }

    try {
      await this.utilsChannelService.channelExists(channelId);
    } catch (error) {
      throw error;
    }

    try {
      await this.utilsChannelService.channelNameIsTaken(
        channel.name,
        channelId,
      );
    } catch (error) {
      throw error;
    }

    let userIsOwner: boolean;
    try {
      userIsOwner = await this.utilsChannelService.userIsOwner(
        userId,
        channelId,
      );
    } catch (error) {
      throw error;
    }

    try {
      await this.utilsChannelService.userAuthorizedToUpdate(
        channel.isPublic,
        channel.password,
        channelId,
        userIsOwner,
      );
    } catch (error) {
      throw error;
    }

    if (userIsOwner == true) {
      try {
        return await this.utilsChannelService.updateChannelAsOwner(
          channelId,
          channel,
        );
      } catch (error) {
        throw error;
      }
    }

    if (
      (await this.utilsChannelService.userIsAdmin(userId, channelId)) == true
    ) {
      try {
        return await this.utilsChannelService.updateChannelAsAdmin(
          channel.name,
          channelId,
        );
      } catch (error) {
        throw error;
      }
    }
    throw new UnauthorizedException('User is not an admin');
  }

  //
  //
  //
  // !!! replacing Promise type
  async getChannel(
    channelId: number,
  ): Promise<ChannelDataWithUsersWithoutPassword> {
    try {
      await this.utilsChannelService.channelExists(channelId);
    } catch (error) {
      throw error;
    }

    try {
      const result = await db
        .selectFrom('channel')
        .where('channel.id', '=', channelId)
        .leftJoin('channelMember', 'channel.id', 'channelMember.channelId')
        .leftJoin('user', 'channelMember.userId', 'user.id')
        .select([
          'channel.channelOwner',
          'channel.createdAt',
          'channel.id',
          'channel.isPublic',
          'channel.name',
          'channel.photoUrl',
          'user.id as userId',
          'user.username',
          'user.avatarUrl',
          'user.rating',
        ])
        .execute();

      if (result.length === 0) {
        throw new NotFoundException('Channel not found');
      }

      const channelInfo = result[0];
      const users = result.map((user) => ({
        userId: user.userId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        rating: user.rating,
        status: this.usersStatusGateway.getUserStatus(user.userId as number),
      }));

      const channelData: ChannelDataWithUsersWithoutPassword = {
        channelOwner: channelInfo.channelOwner,
        createdAt: channelInfo.createdAt,
        id: channelInfo.id,
        isPublic: channelInfo.isPublic,
        name: channelInfo.name as string,
        photoUrl: channelInfo.photoUrl,
        users: users.map((user) => ({
          userId: user.userId as number,
          username: user.username as string,
          avatarUrl: user.avatarUrl as string,
          rating: user.rating as number,
          status: user.status,
        })),
      };

      console.log('channelData:', channelData.users);

      return channelData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async getAllChannelsOfTheUser(userId: number): Promise<UserChannel[]> {
    const channels = await db
      .selectFrom('channelMember')
      .where('userId', '=', userId)
      .innerJoin('channel', 'channel.id', 'channelMember.channelId')
      .selectAll('channel')
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

  async joinUserToChannel(userId: number, channelId: number) {
    await db
      .insertInto('channelMember')
      .values({ channelId, userId })
      .executeTakeFirstOrThrow();
  }

  async removeMember(memberId: number, channelId: number) {
    await db
      .deleteFrom('channelMember')
      .where('channelMember.userId', '=', memberId)
      .where('channelMember.channelId', '=', channelId)
      .execute();
  }
}

import {
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
  ChannelDataWithoutPassword,
  ChannelUpdate,
  ChannelWithoutPsw,
  MessageWithSenderInfo,
} from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';
import { Utils } from './utilsChannel.service';
import { unlink } from 'fs/promises';

@Injectable()
export class ChannelService {
  constructor(private readonly utilsChannelService: Utils) {}

  async setPhoto(userId: number, channelId: number, path: string): Promise<ChannelWithoutPsw> {
    //? Check if user is channel admin
    let result: {
      channelId: number;
      userId: number;
  } | undefined;
    try {
      result = await db
      .selectFrom('channelAdmin')
      .selectAll()
      .where(({ eb, and}) => and([
        eb('channelId', '=', channelId),
        eb('userId', '=', userId)
      ]))
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

    if (!result)
      throw new UnprocessableEntityException("user is not channel admin");

    try {
      const result = await db
      .selectFrom('channel')
      .select('photoUrl')
      .where('id', '=', channelId)
      .executeTakeFirst();
      try {
        if (result != undefined && result.photoUrl != null && result.photoUrl.includes(`/api/channels`, 0)) {
          await unlink(result.photoUrl.replace(`/api/channels/photo`, 'public/channels/'));
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
      const {password, ...channelWithoutPsw} = channel;
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
    channel: ChannelCreationData,
    userId: number,
  ): Promise<ChannelDataWithoutPassword> {
    try {
      this.utilsChannelService.verifyLength(channel.name);
    } catch (error) {
      throw new UnprocessableEntityException(
        'Invalid channel name length (1-49)',
      );
    }

    try {
      this.utilsChannelService.verifyLength(channel.photoUrl);
    } catch (error) {
      throw new UnprocessableEntityException('Invalid photo url length (1-49)');
    }

    try {
      const isPublicBoolean = channel.isPublic.toString();
      this.utilsChannelService.canSetPassword(
        isPublicBoolean,
        channel.password,
      );
    } catch (error) {
      throw error;
    }

    try {
      await this.utilsChannelService.channelNameIsTaken(channel.name, 0);
    } catch (error) {
      throw error;
    }

    if (channel.password) {
      try {
        await this.utilsChannelService.passwordSecurityVerification(
          channel.password,
        );
      } catch (error) {
        throw error;
      }
    }

    const hashedPassword = channel.password
      ? await bcrypt.hash(channel.password, 10)
      : null;

    try {
      const newChannel = await db
        .insertInto('channel')
        .values({
          channelOwner: userId,
          isPublic: channel.isPublic,
          name: channel.name,
          password: hashedPassword,
          photoUrl: channel.photoUrl,
        })
        .execute();
      console.log('newChannel:', newChannel);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    let newChannelId: number;
    try {
      newChannelId = await this.utilsChannelService.getChannelId(
        userId,
        channel,
      );
    } catch (error) {
      throw error;
    }

    try {
      await db
        .insertInto('channelAdmin')
        .values({
          channelId: newChannelId,
          userId: userId,
        })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    try {
      await db
        .insertInto('channelMember')
        .values({
          channelId: newChannelId,
          userId: userId,
        })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    try {
      const newChannel = await db
        .selectFrom('channel')
        .select([
          'id',
          'channelOwner',
          'createdAt',
          'isPublic',
          'name',
          'photoUrl',
        ])
        .where('channelOwner', '=', userId)
        .where('name', '=', channel.name)
        .executeTakeFirst();
      console.log('newChannel:', newChannel);
      return newChannel as ChannelDataWithoutPassword;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
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
      // !!! test type variable
      console.log(typeof channel.isPublic);
      // !!! need to ask Seth
      //
      const isPublicString = channel.isPublic.toString();
      let isPublicBoolean: boolean;
      if (isPublicString === 'true') {
        isPublicBoolean = true;
      } else if (isPublicString === 'false') {
        isPublicBoolean = false;
      } else {
        throw new UnprocessableEntityException('Invalid isPublic value');
      }
      //

      await this.utilsChannelService.userAuthorizedToUpdate(
        isPublicBoolean,
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
          channel.photoUrl,
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
  async getChannel(channelId: number): Promise<ChannelDataWithoutPassword> {
    try {
      await this.utilsChannelService.channelExists(channelId);
    } catch (error) {
      throw error;
    }

    try {
      const channel = (await db
        .selectFrom('channel')
        .where('id', '=', channelId)
        .select([
          'channelOwner',
          'createdAt',
          'id',
          'isPublic',
          'name',
          'photoUrl',
        ])
        .executeTakeFirst()) as ChannelDataWithoutPassword;

      return channel;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // Channels where user is member and not banned
  async getAllChannelsOfTheUser(
    userId: number,
  ): Promise<ChannelDataWithUsersWithoutPassword[]> {
    try {
      const channelsInfo = await db
        .selectFrom('channel')
        .leftJoin('channelMember', 'channel.id', 'channelMember.channelId')
        .leftJoin('user', 'channelMember.userId', 'user.id')
        .leftJoin('bannedUser', (join) =>
          join
            .onRef('channel.id', '=', 'bannedUser.channelId')
            .on('bannedUser.bannedId', '=', userId),
        )
        .select([
          'channel.channelOwner',
          'channel.createdAt',
          'channel.id',
          'channel.isPublic',
          'channel.name',
          'channel.photoUrl',
          'channelMember.userId',
          'user.username',
          'user.avatarUrl',
          'bannedUser.bannedId',
        ])
        .where('channelMember.userId', '=', userId)
        .where('bannedUser.bannedId', 'is', null)
        .execute();

      const channelsWithUsers: ChannelDataWithUsersWithoutPassword[] = [];

      for (const channelInfo of channelsInfo) {
        const usersInfo = await db
          .selectFrom('channelMember')
          .leftJoin('user', 'channelMember.userId', 'user.id')
          .select(['channelMember.userId', 'user.username', 'user.avatarUrl'])
          .where('channelMember.channelId', '=', channelInfo.id)
          .execute();

        const channelWithUsers: ChannelDataWithUsersWithoutPassword = {
          channelOwner: channelInfo.channelOwner,
          createdAt: channelInfo.createdAt,
          id: channelInfo.id,
          isPublic: channelInfo.isPublic,
          users: usersInfo.map((userInfo) => ({
            userId: userInfo.userId,
            username: userInfo.username as string,
            avatarUrl: userInfo.avatarUrl as string,
          })),
        };
        channelsWithUsers.push(channelWithUsers);
      }

      return channelsWithUsers;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

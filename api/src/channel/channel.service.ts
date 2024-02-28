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
  ChannelDataWithoutPassword,
  ChannelUpdate,
  MessageWithSenderInfo,
} from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';
import { Utils } from './utilsChannel.service';

@Injectable()
export class ChannelService {
  constructor(private readonly utilsChannelService: Utils) {}

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
    // !!! TODO password length, in PUT too

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
      // !!! to export everywhere
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

    let channel: ChannelDataWithoutPassword;
    try {
      channel = (await db
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
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return channel;
  }

  //
  //
  //
  // Channels where user is member and not banned
  async getAllChannelsOfTheUser(
    userId: number,
  ): Promise<ChannelDataWithoutPassword[]> {
    let channels: ChannelDataWithoutPassword[]; // !!! to test
    try {
      channels = (await db
        .selectFrom('channel')
        .leftJoin('channelMember', 'channel.id', 'channelMember.channelId')
        .leftJoin('bannedUser', 'channel.id', 'bannedUser.channelId')
        .select([
          'channel.channelOwner',
          'channel.createdAt',
          'channel.id',
          'channel.isPublic',
          'channel.name',
          'channel.photoUrl',
        ])
        .where('channelMember.userId', '=', userId)
        .where('bannedUser.bannedId', '!=', userId)
        .execute()) as ChannelDataWithoutPassword[];
      console.log('channels:', channels);

      if (!channels) {
        throw new NotFoundException('No channels found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
    return channels;
  }
}

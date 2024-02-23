import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Channel } from '../types/schema';
import { db } from 'src/database';
import {
  ActionOnUser,
  BlockUser,
  ChannelCreationData,
  ChannelDataWithoutPassword,
  ChannelMessageContent,
  ConnectToChannel,
  MessageWithSenderInfo,
  MuteUser,
} from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelService {
  //
  //
  //
  async createMessage(message: ChannelMessageContent): Promise<void> {
    try {
      console.log('createMessage');
      await db
        .insertInto('channelMessage')
        .values({
          channelId: message.channelId,
          content: message.content,
          senderId: message.senderId,
        })
        .executeTakeFirstOrThrow();

      console.log('Msg added');
    } catch (error) {
      console.error('Error creating message:', error);
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
      await this.userExists(userId);
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.channelExists(channelId);
    } catch (error) {
      throw new NotFoundException('Channel not found');
    }

    if ((await this.isChannelMember(userId, channelId)) === false) {
      throw new NotFoundException('User is not a member of the channel');
    }

    try {
      await this.userIsBanned(userId, channelId);
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
        content: message.content,
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
      })) as unknown as MessageWithSenderInfo[];

      if (result.length === 0) {
        throw new NotFoundException('No messages found');
      }

      return result as unknown as MessageWithSenderInfo[];
    } catch (error) {
      console.error('Error getting messages:', error);
      if (error instanceof NotFoundException) throw error;
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
      await this.userExists(userId);
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    const boolPublic = (channel.isPublic as unknown as boolean).toString();
    if (channel.password !== null && boolPublic === 'true') {
      throw new UnprocessableEntityException(
        'A public channel cannot have a password',
      );
    }

    if (
      channel.name === null ||
      (channel.name !== null &&
        (channel.name.length < 1 || channel.name.length > 40))
    ) {
      throw new UnprocessableEntityException('Invalid channel name length');
    }

    // Verify if channel name is available
    let nameExists: { name: string | null } | undefined;
    try {
      nameExists = await db
        .selectFrom('channel')
        .select('name')
        .where('name', '=', channel.name)
        .executeTakeFirst();
    } catch (error) {
      throw new UnprocessableEntityException();
    }
    if (nameExists) {
      throw new UnprocessableEntityException('Channel name already exists');
    }

    const hashedPassword = channel.password
      ? await bcrypt.hash(channel.password, 10)
      : null;

    try {
      await db
        .insertInto('channel')
        .values({
          channelOwner: userId,
          isPublic: channel.isPublic as unknown as boolean,
          name: channel.name,
          password: hashedPassword,
          photoUrl: channel.photoUrl,
        })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    let newChannelId: { id: number } | undefined;
    try {
      newChannelId = await db
        .selectFrom('channel')
        .select('id')
        .where('channelOwner', '=', userId)
        .where('name', '=', channel.name)
        .executeTakeFirstOrThrow();
      console.log('Channel created:', newChannelId);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    try {
      await db
        .insertInto('channelAdmin')
        .values({
          channelId: newChannelId.id,
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
          channelId: newChannelId.id,
          userId: userId,
        })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    try {
      const newChannel = await db
        .selectFrom('channel')
        .selectAll()
        .where('channelOwner', '=', userId)
        .where('name', '=', channel.name)
        .executeTakeFirst();
      console.log('newChannel:', newChannel);
      return newChannel as unknown as ChannelDataWithoutPassword;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async deleteChannel(channelId: number, userId: number): Promise<string> {
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.channelExists(channelId);
    } catch (error) {
      throw new NotFoundException('Channel not found');
    }

    // Verify if the user is the owner of the channel
    let isOwner: { channelOwner: number } | undefined;
    try {
      isOwner = await db
        .selectFrom('channel')
        .select('channelOwner')
        .where('id', '=', channelId)
        .where('channelOwner', '=', userId)
        .executeTakeFirst();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!isOwner || isOwner.channelOwner !== userId || isOwner == undefined)
      throw new UnauthorizedException('Only the owner can delete the channel');

    // Delete the channel, the admins and the users
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
    id: number,
    channel: Channel,
    userId: number,
  ): Promise<string> {
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.channelExists(id);
    } catch (error) {
      throw new NotFoundException('Channel not found');
    }

    // Verify if channel name is valid
    if (!channel.name || channel.name.length < 1 || channel.name.length > 40) {
      console.error('Channel name should be more from 1 to 40 characters');
      throw new UnprocessableEntityException('Invalid channel name length');
    }

    // Verify if channel name is available
    let nameFound: { name: string | null }[];
    try {
      nameFound = await db
        .selectFrom('channel')
        .select('name')
        .where('name', '=', channel.name)
        .where('id', '!=', id)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!nameFound) {
      throw new UnprocessableEntityException('Channel name already exists');
    }

    // Verify if it is the same photoUrl
    let result: { photoUrl: string | null } | undefined;
    try {
      result = await db
        .selectFrom('channel')
        .select('photoUrl')
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (result) {
      const url = result.photoUrl;
      if (
        url !== null &&
        channel.photoUrl !== null &&
        url === channel.photoUrl
      ) {
        throw new UnprocessableEntityException(
          'Same as current or Invalid photoUrl',
        );
      }
    } else {
      console.error('Invalid photo url');
      throw new UnprocessableEntityException('Invalid photoUrl');
    }

    // only chanOwner can change owner or password
    let isOwner: { channelOwner: number } | undefined;
    try {
      isOwner = await db
        .selectFrom('channel')
        .select('channelOwner')
        .where('id', '=', id)
        .where('channelOwner', '=', userId)
        .executeTakeFirst();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (isOwner) {
      // !!! to test
      if (channel.password != null) {
        try {
          this.verifyPassword(id, channel.password);
        } catch (error) {
          throw new UnauthorizedException('Invalid password');
        }
      }

      try {
        const hashedPassword = channel.password
          ? await bcrypt.hash(channel.password, 10)
          : null;
        await db
          .updateTable('channel')
          .set({
            channelOwner: channel.channelOwner,
            isPublic: channel.isPublic as unknown as boolean, // !!! to test
            name: channel.name,
            password: hashedPassword,
            photoUrl: channel.photoUrl,
          })
          .where('id', '=', id)
          .executeTakeFirst();
      } catch (error) {
        throw new InternalServerErrorException();
      }
      return `Channel ${id} updated`;
    }

    let isAdmin: { userId: number } | undefined;
    try {
      isAdmin = await db
        .selectFrom('channelAdmin')
        .select('userId')
        .where('channelId', '=', id)
        .where('userId', '=', userId)
        .executeTakeFirst();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (!isAdmin)
      throw new UnauthorizedException(
        'Only the owner or the admin can update this data',
      );
    else {
      try {
        await db
          .updateTable('channel')
          .set({
            name: channel.name,
            photoUrl: channel.photoUrl,
          })
          .where('id', '=', id)
          .executeTakeFirst();
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }
    return `Channel ${id} updated`;
  }

  //
  //
  //
  async getChannel(
    channelId: number,
    userId: number,
  ): Promise<ChannelDataWithoutPassword> {
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.channelExists(channelId);
    } catch (error) {
      throw new NotFoundException('Channel not found');
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
        .executeTakeFirst()) as unknown as ChannelDataWithoutPassword;
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
    // Take user info
    let user: { avatarUrl: string | null; username: string }[];
    try {
      user = await db
        .selectFrom('user')
        .select(['avatarUrl', 'username'])
        .where('id', '=', userId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!user || user.length === 0) {
      throw new NotFoundException('User not found.');
    }

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
        .execute()) as unknown as ChannelDataWithoutPassword[];
      console.log('channels:', channels);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (!channels) {
      throw new NotFoundException('No channels found');
    }
    return channels;
  }

  //
  //
  //
  async channelExists(channelId: number): Promise<void> {
    let channelIdExists: { id: number }[];
    try {
      channelIdExists = await db
        .selectFrom('channel')
        .select('id')
        .where('id', '=', channelId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (!channelIdExists || channelIdExists.length === 0) {
      throw new NotFoundException('Channel not found');
    }
  }

  //
  //
  //
  async userIsBanned(userId: number, channelId: number): Promise<void> {
    let bannedUser: { bannedId: number }[];
    try {
      bannedUser = await db
        .selectFrom('bannedUser')
        .select('bannedId')
        .where('bannedId', '=', userId)
        .where('channelId', '=', channelId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (bannedUser.length > 0) {
      throw new UnauthorizedException('User is banned');
    }
  }

  //
  //
  //
  async userIsMuted(channelMessage: ChannelMessageContent): Promise<void> {
    let mutedUser: { userId: number; mutedEnd: Date }[];
    try {
      mutedUser = await db
        .selectFrom('mutedUser')
        .select(['userId', 'channelId', 'mutedEnd'])
        .where('channelId', '=', channelMessage.channelId)
        .where('userId', '=', channelMessage.senderId)
        .where('mutedEnd', '>', new Date())
        .execute();

      console.log(mutedUser);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (mutedUser.length > 0) {
      throw new UnauthorizedException('User is muted');
    }
  }

  //
  //
  //
  async userExists(userId: number): Promise<void> {
    let userIdExists: { id: number }[];
    try {
      userIdExists = await db
        .selectFrom('user')
        .select('id')
        .where('id', '=', userId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (!userIdExists || userIdExists.length === 0) {
      throw new NotFoundException('User not found');
    }
  }

  //
  //
  //
  async isChannelMember(userId: number, channelId: number): Promise<boolean> {
    try {
      const member = await db
        .selectFrom('channelMember')
        .select('userId')
        .where('userId', '=', userId)
        .where('channelId', '=', channelId)
        .executeTakeFirst();

      if (!member || member.userId == null) {
        console.log(`User ${userId} is not member of the channel ${channelId}`);
        return false;
      }
      console.log(`User ${userId} is member of the channel ${channelId}`);
      return true;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async userIsAdmin(userId: number, channelId: number): Promise<boolean> {
    try {
      const admin = await db
        .selectFrom('channelAdmin')
        .select('userId')
        .where('userId', '=', userId)
        .where('channelId', '=', channelId)
        .executeTakeFirst();

      if (!admin || admin.userId == null) return false;

      return true;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async userIsOwner(userId: number, channelId: number): Promise<boolean> {
    try {
      const owner = await db
        .selectFrom('channel')
        .select('channelOwner')
        .where('channelOwner', '=', userId)
        .where('id', '=', channelId)
        .executeTakeFirst();

      if (!owner || owner.channelOwner == null) return false;

      return true;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async banUser(payload: ActionOnUser): Promise<void> {
    if (
      (await this.isChannelMember(payload.userId, payload.channelId)) ===
        false ||
      (await this.isChannelMember(payload.targetUserId, payload.channelId)) ===
        false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot ban itself');
    }

    try {
      await this.userIsAdmin(payload.userId, payload.channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.userIsOwner(payload.targetUserId, payload.channelId)) === true
    )
      throw new UnauthorizedException('User cannot ban the channel owner');

    try {
      await db
        .insertInto('bannedUser')
        .values({
          bannedById: payload.userId,
          bannedId: payload.targetUserId,
          channelId: payload.channelId,
        })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async unbanUser(payload: ActionOnUser): Promise<void> {
    if (
      (await this.isChannelMember(payload.userId, payload.channelId)) ===
        false ||
      (await this.isChannelMember(payload.targetUserId, payload.channelId)) ===
        false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot unban itself');
    }

    try {
      await this.userIsAdmin(payload.userId, payload.channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.userIsOwner(payload.targetUserId, payload.channelId)) === true
    )
      throw new UnauthorizedException('User cannot unban the channel owner');

    try {
      await db
        .deleteFrom('bannedUser')
        .where('bannedId', '=', payload.targetUserId)
        .where('channelId', '=', payload.channelId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async muteUser(payload: MuteUser): Promise<void> {
    if (
      (await this.isChannelMember(payload.userId, payload.channelId)) ===
        false ||
      (await this.isChannelMember(payload.targetUserId, payload.channelId)) ===
        false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot mute itself');
    }

    try {
      await this.userIsAdmin(payload.userId, payload.channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.userIsOwner(payload.targetUserId, payload.channelId)) === true
    )
      throw new UnauthorizedException('User cannot mute the channel owner');

    try {
      let mutedUserExists = await db
        .selectFrom('mutedUser')
        .select(['userId', 'channelId', 'mutedEnd'])
        .where('userId', '=', payload.targetUserId)
        .where('channelId', '=', payload.channelId)
        .executeTakeFirst();

      if (
        mutedUserExists &&
        mutedUserExists.mutedEnd !== null &&
        mutedUserExists.mutedEnd <= new Date()
      ) {
        await db
          .deleteFrom('mutedUser')
          .where('userId', '=', payload.targetUserId)
          .where('channelId', '=', payload.channelId)
          .execute();
        console.log('User was unmuted, time of mute passed');
        mutedUserExists = undefined;
      }

      if (!mutedUserExists) {
        if (payload.muteEnd === null) {
          const now = new Date();
          payload.muteEnd = new Date(now.getTime() + 5 * 60 * 1000);
          console.log(
            'MuteEnd was set to null, so user is muted for 5 minutes',
          );
        }
        await db
          .insertInto('mutedUser')
          .values({
            channelId: payload.channelId,
            mutedEnd: payload.muteEnd,
            userId: payload.targetUserId,
          })
          .execute();
      } else {
        console.log('User is already muted in the channel');
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! change throw exceptions to return everywhere because of socket disconnection ?
  async unmuteUser(payload: ActionOnUser): Promise<void> {
    if (
      (await this.isChannelMember(payload.userId, payload.channelId)) ===
        false ||
      (await this.isChannelMember(payload.targetUserId, payload.channelId)) ===
        false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot unmute itself');
    }

    try {
      await this.userIsAdmin(payload.userId, payload.channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.userIsOwner(payload.targetUserId, payload.channelId)) === true
    )
      throw new UnauthorizedException('User cannot unmute the channel owner');

    try {
      await db
        .deleteFrom('mutedUser')
        .where('userId', '=', payload.targetUserId)
        .where('channelId', '=', payload.channelId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async blockUser(payload: BlockUser): Promise<void> {
    if (payload.targetUserId === payload.userId) {
      console.log('User cannot block itself');
      return;
    }

    try {
      await this.userExists(payload.userId);
      await this.userExists(payload.targetUserId);
    } catch (error) {
      console.log('User do not exist');
      return;
    }

    try {
      const isAlreadyBlocked = await db
        .selectFrom('blockedUser')
        .where('blockedById', '=', payload.userId)
        .where('blockedId', '=', payload.targetUserId)
        .executeTakeFirst();

      if (isAlreadyBlocked) {
        console.log(
          `User ${payload.userId} already blocked user ${payload.targetUserId}`,
        );
        return;
      }

      await db
        .insertInto('blockedUser')
        .values({
          blockedById: payload.userId,
          blockedId: payload.targetUserId,
        })
        .execute();
      console.log(
        `User ${payload.userId} blocked user ${payload.targetUserId}`,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async unblockUser(payload: BlockUser): Promise<void> {
    if (payload.targetUserId === payload.userId) {
      console.log('User cannot unblock itself');
      return;
    }

    try {
      await this.userExists(payload.userId);
      await this.userExists(payload.targetUserId);
    } catch (error) {
      console.log('User do not exist');
      return;
    }

    try {
      await db
        .deleteFrom('blockedUser')
        .where('blockedById', '=', payload.userId)
        .where('blockedId', '=', payload.targetUserId)
        .execute();
      console.log(
        `User ${payload.userId} unblocked user ${payload.targetUserId}`,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async addAdministrator(payload: ActionOnUser): Promise<void> {
    if (
      (await this.isChannelMember(payload.userId, payload.channelId)) ===
        false ||
      (await this.isChannelMember(payload.targetUserId, payload.channelId)) ===
        false
    ) {
      return;
    }

    if ((await this.userIsAdmin(payload.userId, payload.channelId)) === false) {
      console.log('User is not an admin');
      return;
    }

    if (
      (await this.userIsAdmin(payload.targetUserId, payload.channelId)) === true
    ) {
      console.log('User is already an admin');
      return;
    }

    try {
      await db
        .insertInto('channelAdmin')
        .values({
          channelId: payload.channelId,
          userId: payload.targetUserId,
        })
        .execute();
      console.log(
        `Admin ${payload.userId} promoted user ${payload.targetUserId} to admin`,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async removeAdministrator(payload: ActionOnUser): Promise<void> {
    if (
      (await this.isChannelMember(payload.userId, payload.channelId)) ===
        false ||
      (await this.isChannelMember(payload.targetUserId, payload.channelId)) ===
        false
    ) {
      return;
    }

    if ((await this.userIsAdmin(payload.userId, payload.channelId)) === false) {
      console.log('User is not an admin');
      return;
    }

    if (
      (await this.userIsAdmin(payload.targetUserId, payload.channelId)) ===
      false
    ) {
      console.log('Target user is not an admin');
      return;
    }

    if (
      (await this.userIsOwner(payload.targetUserId, payload.channelId)) === true
    ) {
      console.log(
        `User ${payload.userId} cannot remove channel owner admin priviledges`,
      );
    }

    try {
      await db
        .deleteFrom('channelAdmin')
        .where('userId', '=', payload.targetUserId)
        .where('channelId', '=', payload.channelId)
        .execute();
      console.log(
        `Admin ${payload.userId} removed user's ${payload.targetUserId} admin priviledges`,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to test
  async quitChannel(payload: ConnectToChannel): Promise<void> {
    try {
      await this.userIsOwner(payload.userId, payload.channelId);
    } catch {
      try {
        await this.quitChannelAsAdmin(payload);
      } catch {
        try {
          await this.quitChannelAsMember(payload);
        } catch {
          throw new InternalServerErrorException();
        }
      }
    }
  }

  //
  //
  //
  // !!! to test
  async isOnlyOneMember(channelId: number): Promise<boolean> {
    try {
      const members = await db
        .selectFrom('channelMember')
        .select('userId')
        .where('channelId', '=', channelId)
        .execute();
      return members.length === 1;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to test
  async hasAdmins(channelId: number): Promise<boolean> {
    try {
      const admins = await db
        .selectFrom('channelAdmin')
        .select('userId')
        .where('channelId', '=', channelId)
        .execute();
      return admins.length > 0;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to test
  async setFirstAdminAsOwner(channelId: number): Promise<void> {
    try {
      const newOwner = await db
        .selectFrom('channelAdmin')
        .select('userId')
        .where('channelId', '=', channelId)
        .executeTakeFirstOrThrow();

      await db
        .updateTable('channel')
        .set({
          channelOwner: newOwner.userId,
        })
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to test
  async setFirstMemberAsOwner(channelId: number): Promise<void> {
    try {
      const newOwner = await db
        .selectFrom('channelMember')
        .select('userId')
        .where('channelId', '=', channelId)
        .executeTakeFirstOrThrow();

      await db
        .updateTable('channel')
        .set({
          channelOwner: newOwner.userId,
        })
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to test
  async leaveChannelAsOwner(payload: ConnectToChannel): Promise<void> {
    //if only one member, delete the channel + admin + member + messages
    if (await this.isOnlyOneMember(payload.channelId)) {
      await this.deleteChannel(payload.channelId, payload.userId);
      return;
    }

    //if has other admins, set the first admin as the new owner
    if (await this.hasAdmins(payload.channelId)) {
      await this.setFirstAdminAsOwner(payload.channelId);
      return;
    }

    //if there is no admins, set the first member as the new owner
    await this.setFirstMemberAsOwner(payload.channelId);
  }

  //
  //
  //
  // !!! to test
  async quitChannelAsAdmin(payload: ConnectToChannel) {
    try {
      await db
        .deleteFrom('channelAdmin')
        .where('channelId', '=', payload.channelId)
        .where('userId', '=', payload.userId)
        .executeTakeFirstOrThrow();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to test
  async quitChannelAsMember(payload: ConnectToChannel) {
    try {
      await db
        .deleteFrom('channelMember')
        .where('channelId', '=', payload.channelId)
        .where('userId', '=', payload.userId)
        .executeTakeFirstOrThrow();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async usersAreFriends(userId: number, friendId: number): Promise<boolean> {
    try {
      await db
        .selectFrom('friend')
        .select('user1_id')
        .where(({ eb, or, and }) => or([
          and([
            eb('user1_id', '=', userId),
            eb('user2_id', '=', friendId),
          ]),
          and([
            eb('user1_id', '=', friendId),
            eb('user2_id', '=', userId),
          ])
        ]))
        .executeTakeFirstOrThrow();

      return true;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async verifyPassword(channelId: number, password: string): Promise<boolean> {
    try {
      const channelPwd = await db
        .selectFrom('channel')
        .select('password')
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();

      if (channelPwd.password === null && password !== null) return true;

      const match = await bcrypt.compare(
        password,
        channelPwd.password as string,
      );

      return match;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async joinChannel(userId: number, channelId: number): Promise<void> {
    try {
      const isMember = await db
        .selectFrom('channelMember')
        .where('userId', '=', userId)
        .where('channelId', '=', channelId)
        .execute();
      if (isMember.length > 0) {
        console.log('User is already a member of the channel, not added in db');
        return;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }

    try {
      await db
        .insertInto('channelMember')
        .values({
          channelId: channelId,
          userId: userId,
        })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async kickUser(payload: ActionOnUser): Promise<void> {
    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot kick itself');
    }

    try {
      await this.userIsAdmin(payload.userId, payload.channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.userIsOwner(payload.targetUserId, payload.channelId)) === true
    )
      throw new UnauthorizedException('User cannot kick the channel owner');
  }
}

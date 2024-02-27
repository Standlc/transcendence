import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { db } from 'src/database';
import {
  ActionOnUser,
  BlockUser,
  ChannelCreationData,
  ChannelDataWithoutPassword,
  ChannelMessageContent,
  ChannelUpdate,
  MessageWithSenderInfo,
  MuteUser,
  QuitChannel,
} from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';
import { FriendsService } from 'src/friends/friends.service';

@Injectable()
export class ChannelService {
  constructor(private readonly friendsService: FriendsService) {}

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

      if (result.length === 0) {
        throw new NotFoundException('No messages found');
      }

      return result as MessageWithSenderInfo[];
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
    if (channel.password != null && channel.isPublic == true) {
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
          isPublic: channel.isPublic,
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
      await this.channelExists(channelId);
    } catch (error) {
      throw new NotFoundException('Channel not found');
    }

    if ((await this.userIsOwner(userId, channelId)) === false) {
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
      await this.channelExists(channelId);
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
        .where('id', '!=', channelId)
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
        .where('id', '=', channelId)
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

    // !!! to test
    if ((await this.userIsOwner(userId, channelId)) === true) {
      // !!! to test
      if (channel.password != null) {
        try {
          this.verifyPassword(channelId, channel.password);
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
            isPublic: channel.isPublic,
            name: channel.name,
            password: hashedPassword,
            photoUrl: channel.photoUrl,
          })
          .where('id', '=', channelId)
          .executeTakeFirst();
      } catch (error) {
        throw new InternalServerErrorException();
      }
      return `Channel ${channelId} updated`;
    }

    // !!! to test
    if ((await this.userIsAdmin(userId, channelId)) === false)
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
          .where('id', '=', channelId)
          .executeTakeFirst();
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }
    return `Channel ${channelId} updated`;
  }

  //
  //
  //
  async getChannel(channelId: number): Promise<ChannelDataWithoutPassword> {
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
  // !!! tested
  async quitChannel(payload: QuitChannel): Promise<void> {
    if ((await this.userIsOwner(payload.userId, payload.channelId)) === true) {
      try {
        this.quitChannelAsOwner(payload);
      } catch (error) {
        console.log(error);
      }
      return;
    }

    if ((await this.userIsAdmin(payload.userId, payload.channelId)) === true) {
      try {
        await this.deleteFromChannelAdmin(payload.userId, payload.channelId);
      } catch (error) {
        console.log(error);
      }
    }

    try {
      await this.deleteFromChannelMember(payload.userId, payload.channelId);
    } catch (error) {
      console.log(error);
    }
  }

  //
  //
  //
  // !!! tested
  async isOnlyOneMember(channelId: number): Promise<boolean> {
    try {
      const members = await db
        .selectFrom('channelMember')
        .select('userId')
        .where('channelId', '=', channelId)
        .execute();
      console.log('members.length', members.length);
      return members.length === 1;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async hasAdmins(channelId: number): Promise<boolean> {
    try {
      const admins = await db
        .selectFrom('channelAdmin')
        .select('userId')
        .where('channelId', '=', channelId)
        .execute();
      console.log('admins.length', admins.length);
      return admins.length > 1;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async setFirstAdminAsOwner(
    ownerId: number,
    channelId: number,
  ): Promise<void> {
    try {
      const newOwner = await db
        .selectFrom('channelAdmin')
        .select('userId')
        .where('channelId', '=', channelId)
        .where('userId', '!=', ownerId)
        .executeTakeFirstOrThrow();
      console.log('newOwner id =', newOwner.userId);

      await db
        .updateTable('channel')
        .set({
          channelOwner: newOwner.userId,
        })
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();
      console.log('Updated owner of channel', channelId);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async setFirstMemberAsOwner(
    ownerId: number,
    channelId: number,
  ): Promise<number> {
    try {
      const newOwner = await db
        .selectFrom('channelMember')
        .select('userId')
        .where('channelId', '=', channelId)
        .where('userId', '!=', ownerId)
        .executeTakeFirstOrThrow();

      console.log('newOwner id =', newOwner.userId);

      await db
        .updateTable('channel')
        .set({
          channelOwner: newOwner.userId,
        })
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();

      console.log('Updated owner of channel', channelId);

      return newOwner.userId;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async deleteFromChannelAdmin(
    userId: number,
    channelId: number,
  ): Promise<void> {
    try {
      await db
        .deleteFrom('channelAdmin')
        .where('channelId', '=', channelId)
        .where('userId', '=', userId)
        .executeTakeFirstOrThrow();
      console.log('User deleted from channelAdmin');
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async deleteFromChannelMember(
    userId: number,
    channelId: number,
  ): Promise<void> {
    try {
      await db
        .deleteFrom('channelMember')
        .where('channelId', '=', channelId)
        .where('userId', '=', userId)
        .executeTakeFirstOrThrow();
      console.log('User deleted from channelMember');
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async addNewAdmin(newOwnerId: number, channelId: number): Promise<void> {
    try {
      await db
        .insertInto('channelAdmin')
        .values({
          userId: newOwnerId,
          channelId: channelId,
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
  async quitChannelAsOwner(payload: QuitChannel): Promise<void> {
    if ((await this.isOnlyOneMember(payload.channelId)) === true) {
      console.log('Is only one member');
      await this.deleteChannel(payload.channelId, payload.userId);
      console.log('Quit channel as owner = done');
      return;
    }
    console.log('User not alone in channel');

    //if has other admins, set the first admin as the new owner
    if ((await this.hasAdmins(payload.channelId)) === true) {
      try {
        await this.setFirstAdminAsOwner(payload.userId, payload.channelId);
        await this.deleteFromChannelAdmin(payload.userId, payload.channelId);
        await this.deleteFromChannelMember(payload.userId, payload.channelId);
      } catch (error) {
        console.log(error);
      }
      console.log('Owner left, set another admin as owner');
      return;
    }
    console.log('There is no admins other than the owner');

    //if there is no admins, set the first member as the new owner
    try {
      const newOwnerId = await this.setFirstMemberAsOwner(
        payload.userId,
        payload.channelId,
      );
      await this.deleteFromChannelAdmin(payload.userId, payload.channelId);
      await this.deleteFromChannelMember(payload.userId, payload.channelId);
      await this.addNewAdmin(newOwnerId, payload.channelId);
    } catch (error) {
      console.log(error);
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

  //
  //
  //
  // !!! tested
  async invitedListVerification(payload: ActionOnUser): Promise<void> {
    try {
      await this.channelExists(payload.channelId);
    } catch (error) {
      throw new UnprocessableEntityException("Channel doesn't exist");
    }

    if ((await this.userIsOwner(payload.userId, payload.channelId)) == false) {
      throw new UnauthorizedException('User is not the owner');
    }
  }

  //
  //
  //
  // !!! tested
  async addToInviteList(payload: ActionOnUser): Promise<void> {
    try {
      await this.invitedListVerification(payload);
    } catch (error) {
      throw error;
    }

    if (
      (await this.friendsService.isFriend(
        payload.userId,
        payload.targetUserId,
      )) == false
    ) {
      throw new UnauthorizedException(
        'Users are not friends, impossible to invite to a private or protected channel',
      );
    }

    try {
      await db
        .insertInto('channelInviteList')
        .values({
          invitedUserId: payload.targetUserId,
          invitedByUserId: payload.userId,
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
  async removeFromInviteList(payload: ActionOnUser): Promise<void> {
    try {
      await this.invitedListVerification(payload);
    } catch (error) {
      throw error;
    }

    try {
      await db
        .deleteFrom('channelInviteList')
        .where('invitedUserId', '=', payload.targetUserId)
        .where('invitedByUserId', '=', payload.userId)
        .where('channelId', '=', payload.channelId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to test
  async isInInviteList(userId: number, channelId: number) {
    try {
      const userInList = await db
        .selectFrom('channelInviteList')
        .selectAll()
        .where('channelId', '=', channelId)
        .where('invitedUserId', '=', userId)
        .executeTakeFirst();

      if (!userInList)
        throw new NotFoundException(
          'User not found in invite list of the channel',
        );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }
}

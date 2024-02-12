import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Channel, ChannelMessage } from '../types/schema';
import { db } from 'src/database';
import {
  ChannelCreationData,
  ChannelDataWithoutPassword,
  MessageWithSenderInfo,
} from 'src/types/channelsSchema';
import { ColumnType } from 'kysely';
import * as bcrypt from 'bcrypt';

// !!! TODO : user cannot ban itself
// !!! TODO = execute() or others to change
// !!! TODO = clean
@Injectable()
export class ChannelService {
  //
  //
  //
  async createMessage(message: ChannelMessage): Promise<void> {
    // User exists in db
    // try {
    //  await this.userExists(userId);
    // } catch (error) {
    //  throw new InternalServerErrorException();
    // }
    try {
      console.log('createMessage');
      await db
        .insertInto('channelMessage')
        .values({
          channelId: message.channelId,
          content: message.content,
          senderId: message.senderId,
        })
        .execute();

      console.log('Msg added');
    } catch (error) {
      console.error('Error creating message:', error);
    }
  }

  //
  //
  //
  // !!! TOREWRITE: getmessages

  //
  //
  //
  async createChannel(
    channel: ChannelCreationData,
    userId: number,
  ): Promise<ChannelDataWithoutPassword> {
    // User exists in db
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    // Verify if channel name is valid
    if (
      channel.name === null ||
      (channel.name !== null &&
        (channel.name.length < 1 || channel.name.length > 40))
    ) {
      throw new UnprocessableEntityException('Invalid channel name length');
    }

    // Verify if channel name is available
    let nameExists: { name: string | null } | undefined; // !!! remove null, migration
    try {
      nameExists = await db
        .selectFrom('channel')
        .select('name')
        .where('name', '=', channel.name)
        .executeTakeFirst();
    } catch (error) {
      throw new InternalServerErrorException();
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
          isPublic: Boolean(channel.isPublic), // !!! do not work, always true
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
    // User exists in db
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new InternalServerErrorException();
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
    // User exists in db
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new InternalServerErrorException();
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
          'Same as actual or Invalid photoUrl',
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
      // !!! to test = check if it is the same password
      if (channel.password != null) {
        try {
          const oldPassword = await db
            .selectFrom('channel')
            .select('password')
            .where('id', '=', id)
            .executeTakeFirst();
          if (oldPassword && oldPassword.password != null) {
            const match = await bcrypt.compare(
              channel.password,
              oldPassword.password,
            );
            if (match) {
              throw new UnprocessableEntityException('Same password');
            }
          }
        } catch (error) {
          throw new InternalServerErrorException();
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
            isPublic: Boolean(channel.isPublic), // !!! check, need for the password setting
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
    // User exists in db
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new InternalServerErrorException();
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
    // User exists in db
    try {
      await this.userExists(userId);
    } catch (error) {
      throw new InternalServerErrorException('1');
    }

    // Take user info
    let user: { avatarUrl: string | null; username: string }[];
    try {
      user = await db
        .selectFrom('user')
        .select(['avatarUrl', 'username'])
        .where('id', '=', userId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException('2');
    }

    if (!user || user.length === 0) {
      throw new NotFoundException('Current user not found.');
    }

    let channels: ChannelDataWithoutPassword[];
    try {
      channels = (await db
        .selectFrom('channel')
        .leftJoin('channelMember', 'channel.id', 'channelMember.channelId')
        // .leftJoin('bannedUser', 'channel.id', 'bannedUser.channelId') !!! do not work
        .select([
          'channel.channelOwner',
          'channel.createdAt',
          'channel.id',
          'channel.isPublic',
          'channel.name',
          'channel.photoUrl',
        ])
        .where('channelMember.userId', '=', userId)
        // .where('bannedUser.bannedId', '!=', userId) // !!! do not work
        .execute()) as unknown as ChannelDataWithoutPassword[];
      console.log('channels:', channels);
    } catch (error) {
      throw new InternalServerErrorException('3');
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
    if (!bannedUser || bannedUser.length === 0) {
      throw new UnauthorizedException('User is banned');
    }
  }

  //
  //
  //
  async userIsMuted(channelMessage: ChannelMessage): Promise<void> {
    let mutedUser: { userId: number; mutedEnd: Date }[];
    try {
      mutedUser = await db
        .selectFrom('mutedUser')
        .select(['userId', 'mutedEnd'])
        .where('channelId', '=', channelMessage.channelId)
        .where('userId', '=', channelMessage.senderId)
        .where('mutedEnd', '>', new Date())
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (!mutedUser || mutedUser.length === 0) {
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


  // !!! pseudo code area


  /*
  async userIsAdmin(userId: number, channelId: number): Promise<channelAdmin> {
    try {

      const admin = await db
        .selectFrom('channelAdmin')
        .select('userId')
        .where('userId', '=', userId)
        .where('channelId', '=', channelId)
        .executeTakeFirstOrThrow();

      return admin;
    } else {
      throw new InternalServerError();
    }
  }
  */


  /*
  async userIsOwner(userId: number, channelId: number): Promise<number> {
    try {

      const owner = await db
        .selectFrom('channel')
        .select('channelOwner')
        .where('channelOwner', '=', userId)
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();

      return userId;
    } else {
      throw new InternalServerError();
    }
  }
  */


  /*
  async banUser(userId: number, userToBanId: number, channelId: number) {
    try {
      await userIsAdmin(userId, channelId);
    } catch {
      throw new Error();
    }

    if (userToBanId is in the channel and is not the owner)
    {
      await db
        .insertInto('bannedUser')
        .values(
          bannedById: userId,
          bannedId: userToBanId,
          channelId: channelId,)
        .execute();
    }
  }
  */


  /*
  async unbanUser(userId: number, userToUnbanId: number, channelId: number)) {
    try {
      await userIsAdmin(userId, channelId);
    } catch {
      throw new Error();
    }

    if (userToUnbanId is in the channel and is not the owner) {
      await db
        .deleteFrom('bannedUser')
        .where('id', '=', 'userToUnbanId')
        .where('channelId', '=', 'channelId')
        .execute();
    }
  }
  */


  /*
  async muteUser(userId: number, userToMuteId: number, channelId: number, endTime: Timestamp)
    try {
      await userIsAdmin(userId, channelId);
    } catch {
      throw new Error();
    }

    if (userToMuteId is in the channel and is not the owner)
    {
      await db
        .insertInto('mutedUser')
        .values(
          channelId: channelId,
          mutedEnd: endTime,
          userId: userId,
        )
        .execute();
    }
  */


  /*
  async unmuteUser(userId: number, userToUnmuteId: number, channelId: number) {
    try {
      await userIsAdmin(userId, channelId);
    } catch {
      throw new Error();
    }
  
    if (userToMuteId is in the channel and is not the owner) {
      await db
        .deleteFrom('mutedUser')
        .where('id', '=', 'userToUnmuteId')
        .where('id', '=', 'channelId')
        .execute();
    }
  }
  */


  // !!!  need to implement an autodelete function to clean 'mutedUser'
  //      when the mutedEnd time comes


  /*
  async blockUser(userId: number, userToBlock: number) {
    
    await db
      .insertInto('blockerUser')
      .values(
        blockedById: userId,
        blockedId: userToBlock,
      )
      .execute();
  }
  */


  /*
  async unblockUser(userId: number, userToUnblock: number) {
    
    await db
      .deleteFrom('blockerUser')
      .where('blockedById', '=', 'userId')
      .where('blockedId', '=', 'userToUnblock')
      .execute();
  }
  */


  /*
  async setAdministrator(userId: number, newAdminId: number, channelId: number) {
    try {
      await userIsAdmin(userId, channelId);
    } catch {
      throw new Error();
    }

    await db
      .insertInto('channelAdmin')
      .values(
        channelId: channelId,
        userId: newAdminId,
      )
      .execute();
  }
  */


  /*
  async unsetAdministrator(userId: number, toDeleteAdminId: number, channelId: number) {
    try {
      await userIsAdmin(userId, channelId);
    } catch {
      throw new Error();
    }

    await db
      .deleteFrom('channelAdmin')
      .where('userId', '=', toDeleteAdminId)
      .where('channelId', '=', channelId)
      .execute();
  }
  */


  /*
  async leaveChannelAsOwner(userId: number, channelId: number) {

    //if only one member, delete the channel + admin + member + messages

    //if has other admins, set the first admin as the new owner

    //if there is no admins, set the first member as the new owner
  }
  */


  /*
  async leaveChannelAsAdmin(userId: number, channelId: number) {

    await db
      .deleteFrom('channelAdmin')
      .where('channelId', '=', channelId)
      .where('userId', '=', userId)
      .execute();

    await db
      .deleteFrom('channelMember')
      .where('channelId', '=', channelId)
      .where('userId', '=', userId)
      .execute()
  }
  */


  /*
  async leaveChannelAsMember(userId: number, channelId: number) {

    await db
      .deleteFrom('channelMember')
      .where('channelId', '=', channelId)
      .where('userId', '=', userId)
      .execute()
  }
  */


  /*
  async usersAreFriends(userId: number, friendId: number): Promise<boolean> {
    try {
      await db
        .selectFrom('friend')
        .select('userId')
        .where('userId', '=', userId)
        .where('friendId', '=', friendId)
        .executeTakeFirstOrThrow();

      return true;
    } else {
      throw new Error();
    }
    throw new Error();
  }
  */


  /*
  async verifyPassword(userId: number, password: string): Promise<boolean> {
    try {
      const user = await db
        .selectFrom('user')
        .select('password')
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();

      const match = await bcrypt.compare(password, user.password);

      return match;
    } else {
      throw new Error();
    }
    throw new Error();
  }
  */
}

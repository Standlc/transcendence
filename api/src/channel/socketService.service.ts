import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { db } from 'src/database';
import { MuteUser } from 'src/types/channelsSchema';
import { Utils } from './utilsChannel.service';
import { sql } from 'kysely';

@Injectable()
export class SocketService {
  constructor(private readonly utilsChannelService: Utils) {}

  //
  //
  //
  async createMessage(
    channelId: number,
    content: string | null,
    senderId: number,
  ) {
    const isMember = await this.utilsChannelService.isChannelMember(
      senderId,
      channelId,
    );
    if (!isMember) throw new ForbiddenException();

    const isUserMuted = await this.utilsChannelService.userIsMuted(
      senderId,
      channelId,
    );
    if (isUserMuted) throw new ForbiddenException();

    const message = await db
      .insertInto('channelMessage')
      .values({
        channelId: channelId,
        content: content,
        senderId: senderId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return message;
  }

  //
  //
  //
  async banUser(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (userId === targetUserId) throw new ForbiddenException();

    const isUserAdmin = await this.utilsChannelService.isUserAdmin(
      userId,
      channelId,
    );
    if (!isUserAdmin) throw new ForbiddenException();

    const isOwner = await this.utilsChannelService.userIsOwner(
      targetUserId,
      channelId,
    );
    if (isOwner)
      throw new ForbiddenException('User cannot ban the channel owner');

    const isMember = await this.utilsChannelService.isChannelMember(
      targetUserId,
      channelId,
    );
    if (!isMember) throw new NotFoundException();

    const isBanned = await this.utilsChannelService.userIsBanned(
      targetUserId,
      channelId,
    );
    if (isBanned) throw new ConflictException();

    try {
      await this.deleteFromChannelMember(targetUserId, channelId);

      await db
        .insertInto('bannedUser')
        .values({
          bannedById: userId,
          bannedId: targetUserId,
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
  async unbanUser(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (userId === targetUserId) throw new ForbiddenException();

    const isUserAdmin = await this.utilsChannelService.isUserAdmin(
      userId,
      channelId,
    );
    if (!isUserAdmin) throw new ForbiddenException();

    try {
      await db
        .deleteFrom('bannedUser')
        .where('bannedId', '=', targetUserId)
        .where('channelId', '=', channelId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async muteUser(
    userId: number,
    { targetUserId, channelId }: MuteUser,
  ): Promise<void> {
    if (userId === targetUserId) throw new ForbiddenException();

    const isUserAdmin = await this.utilsChannelService.isUserAdmin(
      userId,
      channelId,
    );
    if (!isUserAdmin) throw new ForbiddenException();

    const isOwner = await this.utilsChannelService.userIsOwner(
      targetUserId,
      channelId,
    );
    if (isOwner)
      throw new ForbiddenException('User cannot ban the channel owner');

    const isMember = await this.utilsChannelService.isChannelMember(
      targetUserId,
      channelId,
    );
    if (!isMember) throw new NotFoundException();

    // ???check
    await db
      .updateTable('channelMember')
      .where('userId', '=', userId)
      .where('channelId', '=', channelId)
      .set({
        mutedEnd: sql`now() + interval '5 minutes'`,
      })
      .execute();
  }

  async addAdministrator(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (userId === targetUserId) throw new ForbiddenException();

    const isUserAdmin = await this.utilsChannelService.isUserAdmin(
      userId,
      channelId,
    );
    if (!isUserAdmin) throw new ForbiddenException();

    const isMember = await this.utilsChannelService.isChannelMember(
      targetUserId,
      channelId,
    );
    if (!isMember) throw new NotFoundException();

    await db
      .updateTable('channelMember')
      .where('channelMember.channelId', '=', channelId)
      .where('channelMember.userId', '=', userId)
      .set({
        isAdmin: true,
      })
      .execute();
    console.log(`Admin ${userId} promoted user ${targetUserId} to admin`);
  }

  async removeAdministrator(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (userId === targetUserId) throw new ForbiddenException();

    const isUserAdmin = await this.utilsChannelService.isUserAdmin(
      userId,
      channelId,
    );
    if (!isUserAdmin) throw new ForbiddenException();

    const isOwner = await this.utilsChannelService.userIsOwner(
      targetUserId,
      channelId,
    );
    if (isOwner) throw new ForbiddenException();

    const isMember = await this.utilsChannelService.isChannelMember(
      targetUserId,
      channelId,
    );
    if (!isMember) throw new NotFoundException();

    await db
      .updateTable('channelMember')
      .where('userId', '=', targetUserId)
      .where('channelId', '=', channelId)
      .set({
        isAdmin: false,
      })
      .execute();
  }

  //
  //
  //
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
  async hasAdmins(channelId: number): Promise<boolean> {
    try {
      const admins = await db
        .selectFrom('channelMember')
        .select('userId')
        .where('channelId', '=', channelId)
        .where('isAdmin', '=', true)
        .execute();
      return admins.length > 1;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

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
  async kickUser(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (userId === targetUserId) throw new ForbiddenException();

    const isUserAdmin = await this.utilsChannelService.isUserAdmin(
      userId,
      channelId,
    );
    if (!isUserAdmin) throw new ForbiddenException();

    const isOwner = await this.utilsChannelService.userIsOwner(
      targetUserId,
      channelId,
    );
    if (isOwner) throw new ForbiddenException();

    await this.deleteFromChannelMember(userId, channelId);
  }
}

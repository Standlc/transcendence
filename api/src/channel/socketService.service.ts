import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from 'src/database';
import { ActionOnUser, MuteUser } from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';
import { Utils } from './utilsChannel.service';
import { ChannelService } from './channel.service';
import { FriendsService } from 'src/friends/friends.service';

@Injectable()
export class SocketService {
  constructor(
    private readonly utilsChannelService: Utils,
    private readonly channelService: ChannelService,
    private readonly friendsService: FriendsService,
  ) {}

  //
  //
  //
  async createMessage(
    channelId: number,
    content: string | null,
    senderId: number,
  ): Promise<void> {
    try {
      console.log('createMessage');
      await db
        .insertInto('channelMessage')
        .values({
          channelId: channelId,
          content: content,
          senderId: senderId,
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
  async banUser(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(userId, channelId)) ===
        false ||
      (await this.utilsChannelService.isChannelMember(
        targetUserId,
        channelId,
      )) === false
    ) {
      return;
    }

    if (targetUserId == userId) {
      throw new UnauthorizedException('User cannot ban itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(userId, channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(targetUserId, channelId)) ===
      true
    )
      throw new UnauthorizedException('User cannot ban the channel owner');

    try {
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
  // !!! tested
  async unbanUser(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(userId, channelId)) ===
        false ||
      (await this.utilsChannelService.isChannelMember(
        targetUserId,
        channelId,
      )) === false
    ) {
      return;
    }

    if (targetUserId === userId) {
      throw new UnauthorizedException('User cannot unban itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(userId, channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(targetUserId, channelId)) ===
      true
    )
      throw new UnauthorizedException('User cannot unban the channel owner');

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
  // !!! tested
  async muteUser(userId: number, payload: MuteUser): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(
        userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (payload.targetUserId === userId) {
      throw new UnauthorizedException('User cannot mute itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(userId, payload.channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(
        payload.targetUserId,
        payload.channelId,
      )) === true
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
  async unmuteUser(userId: number, payload: ActionOnUser): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(
        userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (payload.targetUserId === userId) {
      throw new UnauthorizedException('User cannot unmute itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(userId, payload.channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(
        payload.targetUserId,
        payload.channelId,
      )) === true
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
  async blockUser(userId: number, targetUserId: number): Promise<void> {
    if (targetUserId === userId) {
      console.log('User cannot block itself');
      return;
    }

    try {
      await this.utilsChannelService.userExists(userId);
      await this.utilsChannelService.userExists(targetUserId);
    } catch (error) {
      console.log('User do not exist');
      return;
    }

    try {
      const isAlreadyBlocked = await db
        .selectFrom('blockedUser')
        .where('blockedById', '=', userId)
        .where('blockedId', '=', targetUserId)
        .executeTakeFirst();

      if (isAlreadyBlocked) {
        console.log(`User ${userId} already blocked user ${targetUserId}`);
        return;
      }

      await db
        .insertInto('blockedUser')
        .values({
          blockedById: userId,
          blockedId: targetUserId,
        })
        .execute();
      console.log(`User ${userId} blocked user ${targetUserId}`);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async unblockUser(userId: number, targetUserId: number): Promise<void> {
    if (targetUserId === userId) {
      console.log('User cannot unblock itself');
      return;
    }

    try {
      await this.utilsChannelService.userExists(userId);
      await this.utilsChannelService.userExists(targetUserId);
    } catch (error) {
      console.log('User do not exist');
      return;
    }

    try {
      await db
        .deleteFrom('blockedUser')
        .where('blockedById', '=', userId)
        .where('blockedId', '=', targetUserId)
        .execute();
      console.log(`User ${userId} unblocked user ${targetUserId}`);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async addAdministrator(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(userId, channelId)) ===
        false ||
      (await this.utilsChannelService.isChannelMember(
        targetUserId,
        channelId,
      )) === false
    ) {
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(userId, channelId)) === false
    ) {
      console.log('User is not an admin');
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(targetUserId, channelId)) ===
      true
    ) {
      console.log('User is already an admin');
      return;
    }

    try {
      await db
        .insertInto('channelAdmin')
        .values({
          channelId: channelId,
          userId: targetUserId,
        })
        .execute();
      console.log(`Admin ${userId} promoted user ${targetUserId} to admin`);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async removeAdministrator(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(userId, channelId)) ===
        false ||
      (await this.utilsChannelService.isChannelMember(
        targetUserId,
        channelId,
      )) === false
    ) {
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(userId, channelId)) === false
    ) {
      console.log('User is not an admin');
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(targetUserId, channelId)) ===
      false
    ) {
      console.log('Target user is not an admin');
      return;
    }

    if (
      (await this.utilsChannelService.userIsOwner(targetUserId, channelId)) ===
      true
    ) {
      console.log(
        `User ${userId} cannot remove channel owner admin priviledges`,
      );
    }

    try {
      await db
        .deleteFrom('channelAdmin')
        .where('userId', '=', targetUserId)
        .where('channelId', '=', channelId)
        .execute();
      console.log(
        `Admin ${userId} removed user's ${targetUserId} admin priviledges`,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  async quitChannel(userId: number, channelId: number): Promise<void> {
    if (
      (await this.utilsChannelService.userIsOwner(userId, channelId)) === true
    ) {
      try {
        this.quitChannelAsOwner(userId, channelId);
      } catch (error) {
        console.log(error);
      }
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(userId, channelId)) === true
    ) {
      try {
        await this.deleteFromChannelAdmin(userId, channelId);
      } catch (error) {
        console.log(error);
      }
    }

    try {
      await this.deleteFromChannelMember(userId, channelId);
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
  async quitChannelAsOwner(userId: number, channelId: number): Promise<void> {
    if ((await this.isOnlyOneMember(channelId)) === true) {
      console.log('Is only one member');
      await this.channelService.deleteChannel(channelId, userId);
      console.log('Quit channel as owner = done');
      return;
    }
    console.log('User not alone in channel');

    //if has other admins, set the first admin as the new owner
    if ((await this.hasAdmins(channelId)) === true) {
      try {
        await this.setFirstAdminAsOwner(userId, channelId);
        await this.deleteFromChannelAdmin(userId, channelId);
        await this.deleteFromChannelMember(userId, channelId);
      } catch (error) {
        console.log(error);
      }
      console.log('Owner left, set another admin as owner');
      return;
    }
    console.log('There is no admins other than the owner');

    //if there is no admins, set the first member as the new owner
    try {
      const newOwnerId = await this.setFirstMemberAsOwner(userId, channelId);
      await this.deleteFromChannelAdmin(userId, channelId);
      await this.deleteFromChannelMember(userId, channelId);
      await this.addNewAdmin(newOwnerId, channelId);
    } catch (error) {
      console.log(error);
    }
  }

  //
  //
  //
  async verifyPassword(channelId: number, password: string): Promise<void> {
    try {
      const channelPwd = await db
        .selectFrom('channel')
        .select('password')
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();

      if (!channelPwd.password) return;

      const match = await bcrypt.compare(
        password,
        channelPwd.password as string,
      );

      if (match == false) throw new UnauthorizedException('Invalid password');
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
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
    if (targetUserId === userId) {
      throw new UnauthorizedException('User cannot kick itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(userId, channelId);
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(targetUserId, channelId)) ===
      true
    )
      throw new UnauthorizedException('User cannot kick the channel owner');
  }

  //
  //
  //
  // !!! tested
  async invitedListVerification(
    userId: number,
    channelId: number,
  ): Promise<void> {
    try {
      await this.utilsChannelService.channelExists(channelId);
    } catch (error) {
      throw error;
    }

    if (
      (await this.utilsChannelService.userIsOwner(userId, channelId)) == false
    ) {
      throw new UnauthorizedException('User is not the owner');
    }
  }

  //
  //
  //
  // !!! tested
  async addToInviteList(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    try {
      await this.invitedListVerification(userId, channelId);
    } catch (error) {
      throw error;
    }

    if ((await this.friendsService.isFriend(userId, targetUserId)) == false) {
      throw new UnauthorizedException(
        'Users are not friends, impossible to invite to a private or protected channel',
      );
    }

    try {
      await db
        .insertInto('channelInviteList')
        .values({
          invitedUserId: targetUserId,
          invitedByUserId: userId,
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
  async removeFromInviteList(
    userId: number,
    channelId: number,
    targetUserId: number,
  ): Promise<void> {
    try {
      await this.invitedListVerification(userId, channelId);
    } catch (error) {
      throw error;
    }

    try {
      await db
        .deleteFrom('channelInviteList')
        .where('invitedUserId', '=', targetUserId)
        .where('invitedByUserId', '=', userId)
        .where('channelId', '=', channelId)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
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

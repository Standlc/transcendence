import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from 'src/database';
import {
  ActionOnUser,
  BlockUser,
  ChannelMessageContent,
  MuteUser,
  QuitChannel,
} from 'src/types/channelsSchema';
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
  async banUser(payload: ActionOnUser): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(
        payload.userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot ban itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      );
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(
        payload.targetUserId,
        payload.channelId,
      )) === true
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
      (await this.utilsChannelService.isChannelMember(
        payload.userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot unban itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      );
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(
        payload.targetUserId,
        payload.channelId,
      )) === true
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
      (await this.utilsChannelService.isChannelMember(
        payload.userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot mute itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      );
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
  async unmuteUser(payload: ActionOnUser): Promise<void> {
    if (
      (await this.utilsChannelService.isChannelMember(
        payload.userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (payload.targetUserId === payload.userId) {
      throw new UnauthorizedException('User cannot unmute itself');
    }

    try {
      await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      );
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
  async blockUser(payload: BlockUser): Promise<void> {
    if (payload.targetUserId === payload.userId) {
      console.log('User cannot block itself');
      return;
    }

    try {
      await this.utilsChannelService.userExists(payload.userId);
      await this.utilsChannelService.userExists(payload.targetUserId);
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
      await this.utilsChannelService.userExists(payload.userId);
      await this.utilsChannelService.userExists(payload.targetUserId);
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
      (await this.utilsChannelService.isChannelMember(
        payload.userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      )) === false
    ) {
      console.log('User is not an admin');
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(
        payload.targetUserId,
        payload.channelId,
      )) === true
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
      (await this.utilsChannelService.isChannelMember(
        payload.userId,
        payload.channelId,
      )) === false ||
      (await this.utilsChannelService.isChannelMember(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      )) === false
    ) {
      console.log('User is not an admin');
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(
        payload.targetUserId,
        payload.channelId,
      )) === false
    ) {
      console.log('Target user is not an admin');
      return;
    }

    if (
      (await this.utilsChannelService.userIsOwner(
        payload.targetUserId,
        payload.channelId,
      )) === true
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
    if (
      (await this.utilsChannelService.userIsOwner(
        payload.userId,
        payload.channelId,
      )) === true
    ) {
      try {
        this.quitChannelAsOwner(payload);
      } catch (error) {
        console.log(error);
      }
      return;
    }

    if (
      (await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      )) === true
    ) {
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
      await this.channelService.deleteChannel(
        payload.channelId,
        payload.userId,
      );
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
      await this.utilsChannelService.userIsAdmin(
        payload.userId,
        payload.channelId,
      );
    } catch {
      throw new UnauthorizedException('User is not an admin');
    }

    if (
      (await this.utilsChannelService.userIsOwner(
        payload.targetUserId,
        payload.channelId,
      )) === true
    )
      throw new UnauthorizedException('User cannot kick the channel owner');
  }

  //
  //
  //
  // !!! tested
  async invitedListVerification(payload: ActionOnUser): Promise<void> {
    try {
      await this.utilsChannelService.channelExists(payload.channelId);
    } catch (error) {
      throw error;
    }

    if (
      (await this.utilsChannelService.userIsOwner(
        payload.userId,
        payload.channelId,
      )) == false
    ) {
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

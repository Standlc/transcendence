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
  ChannelMessageContent,
  ChannelUpdate,
} from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class Utils {
  // PUT request

  //
  //
  //
  // !!! tested
  async updateChannelAsOwner(
    channelId: number,
    channel: ChannelUpdate,
  ): Promise<string> {
    try {
      if (channel.password) {
        try {
          await this.passwordSecurityVerification(channel.password);
        } catch (error) {
          throw error;
        }
      }

      let hashedPassword: string | null = null;
      if (channel.password != null) {
        hashedPassword = channel.password
          ? await bcrypt.hash(channel.password, 10)
          : null;
      }

      if (hashedPassword == null && channel.password) {
        throw new UnprocessableEntityException('Unable to hash password');
      }

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
      if (error instanceof UnprocessableEntityException) throw error;
      throw new InternalServerErrorException();
    }
    return `Channel ${channelId} updated by owner`;
  }

  //
  //
  //
  // !!! tested
  async updateChannelAsAdmin(
    name: string | null,
    photoUrl: string | null,
    channelId: number,
  ): Promise<string> {
    try {
      await db
        .updateTable('channel')
        .set({
          name: name,
          photoUrl: photoUrl,
        })
        .where('id', '=', channelId)
        .executeTakeFirst();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return `Channel ${channelId} updated by admin`;
  }

  //
  //
  // !!! tested
  async channelNameIsTaken(
    name: string | null,
    channelId: number,
  ): Promise<void> {
    if (!name || name == null) return;
    try {
      const nameFound = await db
        .selectFrom('channel')
        .select('name')
        .where('name', '=', name)
        .where('id', '!=', channelId)
        .executeTakeFirst();
      if (nameFound) {
        throw new UnprocessableEntityException('Channel name already exists');
      }
    } catch (error) {
      if (error instanceof UnprocessableEntityException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested
  verifyLength(name: string | null): void {
    if (!name || name == null) return;
    if (name.length < 1 || name.length > 49) {
      throw new UnprocessableEntityException();
    }
  }

  //
  //
  //
  // !!! tested
  canSetPassword(isPublic: string, password: string | null): void {
    if (isPublic === 'true' && password) {
      throw new UnprocessableEntityException(
        'A public channel cannot have a password',
      );
    }
  }

  //
  //
  //
  // !!! tested
  dataCanBeUpdated(channel: ChannelUpdate): void {
    if (
      !channel.isPublic &&
      !channel.name &&
      !channel.password &&
      !channel.photoUrl
    ) {
      throw new UnprocessableEntityException('No data to update');
    }

    try {
      const isPublicBool = channel.isPublic.toString();
      this.canSetPassword(isPublicBool, channel.password);
    } catch (error) {
      throw error;
    }

    try {
      this.verifyLength(channel.name);
    } catch (error) {
      throw new UnprocessableEntityException(
        'Invalid channel name length (1-49)',
      );
    }

    try {
      this.verifyLength(channel.photoUrl);
    } catch (error) {
      throw new UnprocessableEntityException('Invalid photoUrl length (1-49)');
    }
  }

  //
  //
  //
  // !!! tested
  async userAuthorizedToUpdate(
    isPublic: boolean,
    password: string | null,
    channelId: number,
    userIsOwner: boolean,
  ): Promise<void> {
    let isPublicUpdated = false;
    let passwordUpdated = false;
    try {
      const currentStatus = await db
        .selectFrom('channel')
        .select(['isPublic', 'password'])
        .where('id', '=', channelId)
        .executeTakeFirstOrThrow();

      if (currentStatus.isPublic !== isPublic) {
        isPublicUpdated = true;
        console.log('isPublic updating to:', isPublic);
      }

      if (
        (!password && !currentStatus.password) ||
        (password != null &&
          currentStatus.password != null &&
          bcrypt.compareSync(password, currentStatus.password) == true)
      ) {
        console.log('passwords match');
        passwordUpdated = false;
      } else {
        console.log('passwords do not match');
        passwordUpdated = true;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (isPublicUpdated == true && userIsOwner == false) {
      throw new UnauthorizedException(
        'Only the owner can change the channel status',
      );
    }

    if (passwordUpdated == true && userIsOwner == false) {
      throw new UnauthorizedException(
        'Only the owner can change the channel password',
      );
    }
  }

  // POST request

  //
  //
  //
  // !!! to test or replace
  async getChannelId(
    userId: number,
    channel: ChannelCreationData,
  ): Promise<number> {
    try {
      const newChannelId = await db
        .selectFrom('channel')
        .select('id')
        .where('channelOwner', '=', userId)
        .where('name', '=', channel.name)
        .where('isPublic', '=', channel.isPublic)
        .executeTakeFirstOrThrow();

      console.log('Channel created:', newChannelId);

      return newChannelId.id;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // other

  //
  //
  //
  // !!! tested
  async passwordSecurityVerification(password: string): Promise<void> {
    if (password.length < 8 || password.length > 20) {
      throw new UnprocessableEntityException('Invalid password length');
    }
    if (!password.match(/[a-zA-Z]/)) {
      throw new UnprocessableEntityException('Password must contain a letter');
    }
    if (!password.match(/[0-9]/)) {
      throw new UnprocessableEntityException('Password must contain a number');
    }
    if (!password.match(/[!@#$%^&*]/)) {
      throw new UnprocessableEntityException(
        'Password must contain a special character !@#$%^&*',
      );
    }
    if (!password.match(/^[a-zA-Z0-9!@#$%^&*]+$/)) {
      throw new UnprocessableEntityException(
        'Password can only contain letters, numbers, and special characters !@#$%^&*',
      );
    }
  }

  //
  //
  // !!! tested
  async channelExists(channelId: number): Promise<void> {
    let channelIdExists: { id: number }[];
    try {
      channelIdExists = await db
        .selectFrom('channel')
        .select('id')
        .where('id', '=', channelId)
        .execute();

      if (!channelIdExists || channelIdExists.length == 0) {
        throw new NotFoundException('Channel not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
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
}

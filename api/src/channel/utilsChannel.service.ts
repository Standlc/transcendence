import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { db } from 'src/database';
import { ChannelCreationData, ChannelUpdate } from 'src/types/channelsSchema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class Utils {
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
  // !!! to test
  async getChannelId(
    userId: number,
    channel: ChannelCreationData,
  ): Promise<number> {
    try {
      const newChannelId = await db
        .selectFrom('channel')
        .select(['id', 'password'])
        .where('channelOwner', '=', userId)
        .where('name', '=', channel.name)
        .where('isPublic', '=', channel.isPublic)
        .executeTakeFirstOrThrow();

      if (
        (channel.password == null && newChannelId.password != null) ||
        (channel.password != null && newChannelId.password == null)
      )
        throw new NotFoundException('Channel not found');
      else if (channel.password != null && newChannelId.password != null) {
        const passwordMatch = await bcrypt.compare(
          channel.password,
          newChannelId.password,
        );

        if (passwordMatch) return newChannelId.id;
        else throw new NotFoundException('Channel not found');
      }

      return newChannelId.id;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  // other

  //
  //
  //

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

  async channelExists(channelId: number): Promise<void> {
    try {
      const channelIdExists = await db
        .selectFrom('channel')
        .where('id', '=', channelId)
        .select('id')
        .executeTakeFirst();

      console.log(channelIdExists);
      if (!channelIdExists) {
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
  async userIsBanned(userId: number, channelId: number): Promise<boolean> {
    const bannedUser = await db
      .selectFrom('bannedUser')
      .where('bannedId', '=', userId)
      .where('channelId', '=', channelId)
      .select('bannedId')
      .executeTakeFirst();
    return bannedUser?.bannedId ? true : false;
  }

  //
  //
  //
  async userIsMuted(senderId: number, channelId: number): Promise<boolean> {
    const mutedUser = await db
      .selectFrom('channelMember')
      .where('channelId', '=', channelId)
      .where('mutedEnd', '<', new Date())
      .where('userId', '=', senderId)
      .select(['userId', 'channelId', 'mutedEnd'])
      .executeTakeFirst();
    return mutedUser?.userId ? true : false;
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
    const member = await db
      .selectFrom('channelMember')
      .select('userId')
      .where('userId', '=', userId)
      .where('channelId', '=', channelId)
      .executeTakeFirst();

    return member?.userId !== null ? true : false;
  }

  async isUserAdmin(userId: number, channelId: number) {
    const member = await db
      .selectFrom('channelMember')
      .select('userId')
      .where('userId', '=', userId)
      .where('channelId', '=', channelId)
      .where('isAdmin', 'is', true)
      .executeTakeFirst();

    return member?.userId !== null ? true : false;
  }

  //
  //
  //
  async userIsAdmin(userId: number, channelId: number): Promise<boolean> {
    try {
      const admin = await db
        .selectFrom('channelMember')
        .where('userId', '=', userId)
        .where('channelId', '=', channelId)
        .select(['isAdmin'])
        .executeTakeFirst();

      return admin?.isAdmin ? true : false;
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
        .where('channelOwner', '=', userId)
        .where('id', '=', channelId)
        .select('channelOwner')
        .executeTakeFirst();

      if (!owner || owner.channelOwner === null) return false;
      return true;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

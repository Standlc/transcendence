import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { db } from 'src/database';
import { PublicChannel } from 'src/types/channelsSchema';

@Injectable()
export class ChannelsService {
  async getAllPublicChannels(userId: number): Promise<PublicChannel[]> {
    return await db
      .selectFrom('channel')
      .where('channel.isPublic', 'is', true)
      .leftJoin('bannedUser', (join) =>
        join.on((eb) =>
          eb.and([
            eb('bannedUser.channelId', '=', eb.ref('channel.id')),
            eb('bannedUser.bannedId', '=', userId),
          ]),
        ),
      )
      .where('bannedId', 'is', null)
      .select((eb) =>
        eb
          .selectFrom('channelMember')
          .select(eb.fn.countAll<number>().as('membersCount'))
          .whereRef('channelMember.channelId', '=', 'channel.id')
          .as('membersCount'),
      )
      .leftJoin('channelMember as user', (join) =>
        join
          .on('user.userId', '=', userId)
          .onRef('user.channelId', '=', 'channel.id'),
      )
      .select((eb) =>
        eb
          .case()
          .when('user.userId', 'is', null)
          .then(false)
          .else(true)
          .end()
          .as('isMember'),
      )
      .select(['channel.id', 'channel.name', 'channel.photoUrl'])
      .orderBy('channel.createdAt desc')
      .execute();
  }

  async joinUserToChannel(userId: number, channelId: number) {
    await db
      .insertInto('channelMember')
      .values({ channelId, userId })
      .executeTakeFirstOrThrow();
  }

  async checkCanUserJoinChannel(userId: number, channelId: number) {
    return await db
      .selectFrom('channel')
      .where('channel.id', '=', channelId)
      .leftJoin('bannedUser', (join) =>
        join.on((eb) =>
          eb.and([
            eb('bannedUser.channelId', '=', eb.ref('channel.id')),
            eb('bannedUser.bannedId', '=', userId),
          ]),
        ),
      )
      .where('bannedId', 'is', null)
      .leftJoin('channelMember', (join) =>
        join.on((eb) =>
          eb.and([
            eb('channelMember.userId', '=', userId),
            eb('channelMember.channelId', '=', channelId),
          ]),
        ),
      )
      .where('channelMember.userId', 'is', null)
      .executeTakeFirst();
  }

  async delete(channelId: number) {
    await db.deleteFrom('channel').where('id', '=', channelId).execute();
  }

  async removeUserFromChannel(userId: number, channelId: number) {
    await db
      .deleteFrom('channelMember')
      .where('channelMember.userId', '=', userId)
      .where('channelMember.channelId', '=', channelId)
      .execute();
  }

  async banMember(
    userBannedId: number,
    adminUserId: number,
    channelId: number,
  ) {
    await db
      .insertInto('bannedUser')
      .values({
        bannedById: adminUserId,
        bannedId: userBannedId,
        channelId: channelId,
      })
      .execute();
  }

  async unbanMember(userBannedId: number, channelId: number) {
    await db
      .deleteFrom('bannedUser')
      .where('bannedId', '=', userBannedId)
      .where('channelId', '=', channelId)
      .execute();
  }

  async checkUserIsOwner(userId: number, channelId: number) {
    const channel = await db
      .selectFrom('channel')
      .where('id', '=', channelId)
      .where('channelOwner', '=', userId)
      .executeTakeFirst();
    return !!channel;
  }

  async checkIsUserAdminOrOwner(userId: number, channelId: number) {
    const adminOrUser = await db
      .selectFrom('channel')
      .where('channel.id', '=', channelId)
      .leftJoin('channelAdmin', (join) =>
        join.on((eb) =>
          eb.and([
            eb('channelAdmin.userId', '=', userId),
            eb('channelAdmin.channelId', '=', channelId),
          ]),
        ),
      )
      .select([
        'channel.id as channelId',
        'channel.channelOwner as channelOwnerId',
        'channelAdmin.userId as adminUserId',
      ])
      .executeTakeFirst();

    if (!adminOrUser) {
      return false;
    }
    return (
      adminOrUser.channelOwnerId === userId ||
      adminOrUser.adminUserId === userId
    );
  }

  async isUserBanned(userId: number, channelId: number) {
    const bannedUser = await db
      .selectFrom('bannedUser')
      .where('bannedId', '=', userId)
      .where('channelId', '=', channelId)
      .executeTakeFirst();
    return !!bannedUser;
  }

  async isUserAMember(userId: number, channelId: number) {
    const member = await db
      .selectFrom('channel')
      .where('channel.id', '=', channelId)
      .leftJoin('channelMember', (join) =>
        join.on((eb) =>
          eb.and([
            eb('channelMember.userId', '=', userId),
            eb('channelMember.channelId', '=', channelId),
          ]),
        ),
      )
      .select(['channelMember.userId as id'])
      .executeTakeFirst();
    return member?.id === userId;
  }

  async muteUser(userId: number, channelId: number) {
    const isUserMuted = await this.isUserMuted(userId, channelId);
    if (!isUserMuted) {
      await db
        .insertInto('mutedUser')
        .values({
          channelId: channelId,
          userId: userId,
          mutedEnd: sql`now() + INTERVAL '5 minutes'`,
        })
        .execute();
    }
    await db
      .updateTable('mutedUser')
      .where('channelId', '=', channelId)
      .where('userId', '=', userId)
      .set({
        mutedAt: sql`now()`,
        mutedEnd: sql`now() + INTERVAL '5 minutes'`,
      })
      .execute();
  }

  async isUserMuted(userId: number, channelId: number) {
    const mutedUser = await db
      .selectFrom('mutedUser')
      .where('mutedUser.userId', '=', userId)
      .where('channelId', '=', channelId)
      .select('mutedUser.userId as id')
      .executeTakeFirst();
    return mutedUser?.id === userId;
  }

  async getChannelInfos(channelId: number) {
    const channel = await db
      .selectFrom('channel')
      .where('channel.id', '=', channelId)
      .select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom('channelMember as member')
            .leftJoin('mutedUser', (join) =>
              join.on((eb) =>
                eb.and([
                  eb('mutedUser.userId', '=', eb.ref('member.userId')),
                  eb('mutedUser.channelId', '=', eb.ref('channel.id')),
                ]),
              ),
            )
            .select(['member.userId as id', 'member.joinedAt', 'mutedEnd'])
            .where('member.channelId', '=', channelId),
        ).as('users'),
      )
      .select(['channel.name', 'channel.isPublic', 'channel.photoUrl'])
      .executeTakeFirst();
    return channel;
  }
}

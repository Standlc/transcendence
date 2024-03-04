import { Inject, Injectable, InternalServerErrorException, UnprocessableEntityException, forwardRef } from '@nestjs/common';
import { db } from 'src/database';
import { FriendsService } from 'src/friends/friends.service';
import { ListUsers } from 'src/types/clientSchema';

@Injectable()
export class BlockedUserService {
  constructor(
    @Inject(forwardRef(() => FriendsService))
    private readonly friendsService: FriendsService) {}

  async blockAUser(blockedById: number, blockedId: number) {
    // ? Cant block itself
    if (blockedById === blockedId)
      throw new UnprocessableEntityException("You can't block yourself");

    // ? Can't block someone already blocked
    if (await this.hasUserBlock(blockedById, blockedId))
      throw new UnprocessableEntityException("User already blocked");

    // ? Delete friendship
    if (await this.friendsService.isFriend(blockedById, blockedId))
      await this.friendsService.remove(blockedById, blockedId);

    // ? Remove request of friendship
    try {
      const result = await db
      .selectFrom('friendRequest')
      .selectAll()
      .where(({ eb, or, and }) => or([
        and([
          eb('sourceId', '=', blockedById),
          eb('targetId', '=', blockedId)
        ]),
        and([
          eb('sourceId', '=', blockedId),
          eb('targetId', '=', blockedById)
        ])
      ]))
      .executeTakeFirst();

      if (result) {
        await db
        .deleteFrom('friendRequest')
        .where(({ eb, or, and }) => or([
          and([
            eb('sourceId', '=', blockedById),
            eb('targetId', '=', blockedId)
          ]),
          and([
            eb('sourceId', '=', blockedId),
            eb('targetId', '=', blockedById)
          ])
        ]))
        .execute();
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

    try {
      await db
      .insertInto('blockedUser')
      .values({'blockedById': blockedById, 'blockedId': blockedId})
      .executeTakeFirstOrThrow();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async hasUserBlock(blockedById: number, blockedId: number): Promise<boolean> {
    try {
      const result = await db
      .selectFrom('blockedUser')
      .selectAll()
      .where(({ eb, and }) => and([
          eb('blockedById', '=', blockedById),
          eb('blockedId', '=', blockedId)
      ]))
      .executeTakeFirst();
      if (!result)
        return false;
      return true;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async unblockAUser(blockedById: number, blockedId: number) {
    if (!await this.hasUserBlock(blockedById, blockedId))
      throw new UnprocessableEntityException("You didnt block this user");
    try {
      await db
      .deleteFrom('blockedUser')
      .where(({ eb, or }) => or([
        eb('blockedById', '=', blockedById),
        eb('blockedId', '=', blockedId)
      ]))
      .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async listBlockedUser(blockedById: number): Promise<ListUsers[]> {
    try {
      const blockedIdList = await db
      .selectFrom('blockedUser')
      .select('blockedId')
      .where('blockedById', '=', blockedById)
      .execute();
      if (blockedIdList.length <= 0)
        return [];
      let arrayBlockedId: number[] = [];
      blockedIdList.forEach(element => {
        arrayBlockedId.push(element.blockedId);
      });
      const blockedUserList = await db
      .selectFrom('user')
      .select(['id', 'username', 'avatarUrl'])
      .where('id', 'in', arrayBlockedId)
      .execute();
      return blockedUserList;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}

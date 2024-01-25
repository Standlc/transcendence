import { Injectable } from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { db } from 'src/database';
import { FriendRequest } from 'src/types/schema';
import { Selectable } from 'kysely';
import { first } from 'rxjs';

@Injectable()
export class FriendsService {

  /**
   * Delete friend request and insert into friend the new friendship between
   * sourceId and targetId.
   * @param sourceId userId of who create a friend request
   * @param targetId userId of who accept a friend request
   * @returns true if both sourceId and targetId is now friend, otherwise false
   * is returned.
   */
  async acceptRequest(sourceId: number, targetId: number): Promise<boolean> {
    // ? User can't be friend with itself.
    if (sourceId == targetId)
      return false;

    // ? Check if a friendRequest exist. Exit function if we didnt find any row.
    const request = await db
    .selectFrom('friendRequest')
    .selectAll()
    .where(({ eb, and}) => and([
      eb('sourceId', '=', sourceId),
      eb('targetId', '=', targetId)
    ]))
    .executeTakeFirst();
    if (!request)
      return false

    try {
      // ? Add new friendship to the database.
      await db
      .insertInto('friend')
      .values([
        {
          friendId: sourceId,
          userId: targetId,
        },
        {
          friendId: targetId,
          userId: sourceId,
        }
      ])
      .executeTakeFirstOrThrow();

      // ? After adding the new friendship, we delete the friend request.
      await db
      .deleteFrom('friendRequest')
      .where(({ eb, and}) => and([
        eb('sourceId', '=', sourceId),
        eb('targetId', '=', targetId)
      ]))
      .execute();

      return true;
    } catch (error) {
      return false;
    }
  }


  /**
   * Create a new friend request from sourceId to targetId
   * @param sourceId user who issue the request
   * @param targetId user who will receive the request
   * @returns true if the request is create, otherwise false is returned.
   */
  async requestAFriend(sourceId: number, targetId: number): Promise<boolean> {
    // ? Check if both user arent already friend, exit function if they were
    // ? already friend.
    const isAlreadyFriend = await db
    .selectFrom('friend')
    .selectAll()
    .where(({ eb, and}) => and([
      eb('userId', '=', sourceId),
      eb('friendId', '=', targetId)
    ]))
    .executeTakeFirst();
    if (isAlreadyFriend)
      return false;

    try {
      // ? Insert a new request from sourceId to targetId.
      const result = await db
      .insertInto('friendRequest')
      .values(
        {
          sourceId: sourceId,
          targetId: targetId,
        }
      )
      .executeTakeFirstOrThrow();

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find all friend request of targetId
   * @param targetId
   * @returns Array of request
   */
  async findAllRequest(targetId: number): Promise<Selectable<FriendRequest>[]> {
    const result: Selectable<FriendRequest>[] = await db
    .selectFrom('friendRequest')
    .selectAll()
    .where('targetId', '=', targetId)
    .execute();

    return result;
  }

  /**
   * Delete a friend request from requestUserId.
   * @param requestUserId
   * @param userId
   * @returns true if the request was remove, otherwise false is returned.
   */
  async removeRequest(requestUserId: number, userId: number): Promise<boolean> {
    const result = await db
    .deleteFrom('friendRequest')
    .where(({ eb, and }) => and([
        eb('sourceId', '=', requestUserId),
        eb('targetId', '=', userId)
      ]))
    .executeTakeFirst();

    if (result.numDeletedRows > 0n)
      return true;
    return false;
  }

  async isFriend(selfId: number, friendId: number): Promise<boolean> {
    const result = await db
    .selectFrom('friend')
    .selectAll()
    .where(({ eb, and}) => and([
      eb('userId', '=', selfId),
      eb('friendId', '=', friendId)
    ]))
    .executeTakeFirst()

    if (result)
      return true;
    return false;
  }

  findOne(id: number) {
    return `This action returns a #${id} friend`;
  }

  update(id: number, updateFriendDto: UpdateFriendDto) {
    return `This action updates a #${id} friend`;
  }

  remove(id: number) {
    return `This action removes a #${id} friend`;
  }
}

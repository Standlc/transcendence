import { Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { db } from 'src/database';
import { Friend, FriendRequest } from 'src/types/schema';
import { Selectable } from 'kysely';

@Injectable()
export class FriendsService {

  /**
   * Delete friend request and insert into friend the new friendship between
   * sourceId and targetId.
   * @param sourceId userId of who create a friend request
   * @param targetId userId of who accept a friend request
   * @returns 'Friend added' if both sourceId and targetId is now friend,
   * otherwise an exception is throw.
   * @throws NotFound, InternalServerError.
   */
  async acceptRequest(sourceId: number, targetId: number): Promise<string> {
    // ? Check if a friendRequest exist with sourceId and targetId, if no
    // ? request found, throwing NotFoundException.
    const request = await db
    .selectFrom('friendRequest')
    .selectAll()
    .where(({ eb, and}) => and([
      eb('sourceId', '=', sourceId),
      eb('targetId', '=', targetId)
    ]))
    .executeTakeFirst();
    if (!request) {
      console.log('Tried to accept an inexistant friend request.');
      throw new NotFoundException();
    }

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

      console.log(targetId, ' accept friend request from ', sourceId);
      return 'Friend added';
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }


  /**
   * Create a new friend request from sourceId to targetId
   * @param sourceId user who issue the request
   * @param targetId user who will receive the request
   * @returns 'Request sent' if the request is create, otherwise an exception is
   * throw.
   * @throws UnprocessableEntity, InternalServerError
   */
  async requestAFriend(sourceId: number, targetId: number): Promise<string> {
    // ? User can't be friend with itself.
    if (sourceId == targetId) {
      console.log("Tried to request itself as friend.");
      throw new UnprocessableEntityException(targetId, "You can't be friend with yourself.");
    }

    // ? Check if both user arent already friend, exit function if they were
    // ? already friend.
    const isAlreadyFriend = await this.isFriend(sourceId, targetId);
    if (isAlreadyFriend) {
      console.log("Tried to send a friend request to a user who is already friend with.");
      throw new UnprocessableEntityException(targetId, "You are already friend with this user.");
    }

    try {
      // ? Insert a new request from sourceId to targetId.
      await db
      .insertInto('friendRequest')
      .values(
        {
          sourceId: sourceId,
          targetId: targetId,
        }
      )
      .executeTakeFirstOrThrow();

      console.log(sourceId, " sent a friend request to ", targetId);
      return "Request sent";
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
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

  async findAllFriends(id: number): Promise<Selectable<Friend>[] | undefined> {
    const result = await db
    .selectFrom('friend')
    .selectAll()
    .where('userId', '=', id)
    .execute();

    return result;
  }

  // update(id: number, updateFriendDto: UpdateFriendDto) {
  //   return `This action updates a #${id} friend`;
  // }

  async remove(selfId: number, friendId: number): Promise<boolean> {
    const result = await db
    .deleteFrom('friend')
    .where(({ eb, or, and }) => or([
      and([
        eb('userId', '=', selfId),
        eb('friendId', '=', friendId),
      ]),
      and([
        eb('friendId', '=', selfId),
        eb('userId', '=', friendId),
      ])
    ]))
    .execute();

    if (result[0].numDeletedRows > 0n)
      return true;
    return false;
  }
}

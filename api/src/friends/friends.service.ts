import { Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { db } from 'src/database';
import { DeleteResult } from 'kysely';
import { AppUser, AppUserDB, ListUsers } from 'src/types/clientSchema';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';

@Injectable()
export class FriendsService {
  constructor(private usersStatusGateway: UsersStatusGateway) {}

  //#region <-- Request -->

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
    let request : {
      createdAt: Date;
      sourceId: number;
      targetId: number;
    } | undefined;
    try {
      request = await db
      .selectFrom('friendRequest')
      .selectAll()
      .where(({ eb, and}) => and([
        eb('sourceId', '=', sourceId),
        eb('targetId', '=', targetId)
      ]))
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!request) {
      console.log('Tried to accept an inexistant friend request.');
      throw new NotFoundException();
    }

    // ? Create the new friendship in the database and deleting the request.
    try {
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

      await db
      .deleteFrom('friendRequest')
      .where(({ eb, and}) => and([
        eb('sourceId', '=', sourceId),
        eb('targetId', '=', targetId)
      ]))
      .executeTakeFirstOrThrow();

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
   * @throws UnprocessableEntity, InternalServerError, NotFound
   */
  async requestAFriend(sourceId: number, targetId: number): Promise<string> {
    // ? User can't be friend with itself.
    if (sourceId == targetId) {
      console.log(sourceId, "Tried to request itself as friend.");
      throw new UnprocessableEntityException(targetId, "You can't be friend with yourself.");
    }

    // ? Check if target exist
    let targetUser: { id:number } | undefined;
    try {
      targetUser = await db
      .selectFrom('user')
      .select('id')
      .where('id', '=', targetId)
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (!targetUser)
      throw new NotFoundException();

    // ? Check if both user arent already friend, exit function if they were
    // ? already friend.
    const isAlreadyFriend = await this.isFriend(sourceId, targetId);
    if (isAlreadyFriend) {
      console.log("Tried to send a friend request to a user who is already friend with.");
      throw new UnprocessableEntityException(targetId, "You are already friend with this user.");
    }

    // ? Check if you didn't already sent a request
    let alreadySent: {
      createdAt: Date;
      sourceId: number;
      targetId: number;
  } | undefined
  ;
    try {
      alreadySent = await db
      .selectFrom('friendRequest')
      .selectAll()
      .where(({eb, and}) => and([
        eb('sourceId', '=', sourceId),
        eb('targetId', '=', targetId)
      ]))
      .executeTakeFirst();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (alreadySent)
      throw new UnprocessableEntityException(targetId, "You already sent a request to this user");

    // ? Create a new request from sourceId to targetId
    try {
      await db
      .insertInto('friendRequest')
      .values(
        {
          sourceId: sourceId,
          targetId: targetId,
        }
      )
      .executeTakeFirst();

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
   * @returns Array of Users who sent a request to targetId
   * @throws NotFound, InternalServerException
   */
  async findAllRequest(targetId: number): Promise<ListUsers[]> {
    let requestsId: { sourceId: number}[];
    try {
      requestsId = await db
      .selectFrom('friendRequest')
      .select('sourceId')
      .where('targetId', '=', targetId)
      .execute();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

    if (!requestsId || requestsId.length === 0)
      throw new NotFoundException();

    let arrayRequestId: number[] = [];
    requestsId.forEach(requestId => {
      arrayRequestId.push(requestId.sourceId);
    });

    let requestUsers: ListUsers[];
    try {
      requestUsers = await db
      .selectFrom('user')
      .select(['id', 'username', 'avatarUrl', 'rating'])
      .where('id', 'in', arrayRequestId)
      .execute()
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    return (requestUsers);
  }

  /**
   * Delete a friend request from requestUserId.
   * @param requestUserId
   * @param userId
   * @returns "Request denied" if the request was remove, otherwise an exception
   * is thrown.
   * @throws NotFound, InternalServerError
   */
  async removeRequest(requestUserId: number, userId: number): Promise<string> {
    let result: DeleteResult;
    try {
      result = await db
      .deleteFrom('friendRequest')
      .where(({ eb, and }) => and([
          eb('sourceId', '=', requestUserId),
          eb('targetId', '=', userId)
        ]))
      .executeTakeFirst();

    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

    if (!result || result.numDeletedRows == 0n) {
      console.log("Tried to remove an inexistant request.")
      throw new NotFoundException(requestUserId, "Request not found");
    }
    return "Request denied";
  }

  //#endregion

  //#region <-- Friends -->

  /**
   * Get every friend of user id, if no friend throw NotFoundException.
   * @param id User id of who we'll get friend list.
   * @returns An array of Friend
   * @throws NotFound, InternalServerError
   */
  async findAllFriends(id: number): Promise<AppUser[]> {
    let friends1_Id: {user1_id: number | null}[];
    let friends2_Id: {user2_id: number | null}[];
    try {
      friends1_Id = await db
      .selectFrom('friend')
      .select('user1_id')
      .orderBy('createdAt asc')
      .groupBy(['user1_id', 'createdAt'])
      .where('user2_id', '=', id)
      .execute();
      friends2_Id = await db
      .selectFrom('friend')
      .select('user2_id')
      .orderBy('createdAt asc')
      .groupBy(['user2_id', 'createdAt'])
      .where('user1_id', '=', id)
      .execute();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

    if ((!friends1_Id && !friends2_Id) || (friends1_Id.length === 0 && friends2_Id.length === 0))
      throw new NotFoundException();

    let arrayFriendsId: (number | null)[] = [];
    friends1_Id.forEach(friend1_Id => {
      arrayFriendsId.push(friend1_Id.user1_id);
    });
    friends2_Id.forEach(friend2_Id => {
      arrayFriendsId.push(friend2_Id.user2_id);
    });

    let friendList: AppUserDB[];
    try {
      friendList = await db
      .selectFrom('user')
      .select(['avatarUrl', 'id', 'username', 'rating', 'bio', 'createdAt', 'email', 'firstname', 'lastname'])
      .where('id', 'in', arrayFriendsId)
      .execute();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    return friendList.map(u => ({...u, status: this.usersStatusGateway.getUserStatus(u?.id)}))
  }

  /**
   * Remove from the friendship between selfId and friendId.
   * @param selfId User id of who issue the request
   * @param friendId User id of the friend to delete form selfId
   * @returns 'Friend deleted' if the friend is deleted, otherwise an exception
   * is thrown.
   * @throws UnprocessableEntity, InternalServerError
   */
  async remove(selfId: number, friendId: number): Promise<string> {
    let result: DeleteResult[];
    try {
      result = await db
      .deleteFrom('friend')
      .where(({ eb, or, and }) => or([
        and([
          eb('user1_id', '=', selfId),
          eb('user2_id', '=', friendId),
        ]),
        and([
          eb('user2_id', '=', selfId),
          eb('user1_id', '=', friendId),
        ])
      ]))
      .execute();

    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

    if (!result || result && result[0].numDeletedRows <= 0n)
      throw new UnprocessableEntityException(friendId, "You are not friend with this user");
    return 'Friend deleted';
  }

  //#endregion

  //#region <-- Friend Utils -->

  async isFriend(selfId: number, friendId: number): Promise<boolean> {
    let result: {
      createdAt: Date;
      user1_id: number | null;
      user2_id: number | null;
    } | undefined;
    try {
      result = await db
      .selectFrom('friend')
      .selectAll()
      .where(({ eb, or, and }) => or([
        and([
          eb('user1_id', '=', selfId),
          eb('user2_id', '=', friendId),
        ]),
        and([
          eb('user2_id', '=', selfId),
          eb('user1_id', '=', friendId),
        ])
      ]))
      .executeTakeFirst()
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    if (result)
      return true;
    return false;
  }

  //#endregion

}

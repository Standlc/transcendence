import { Inject, Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException, forwardRef } from '@nestjs/common';
import { db } from 'src/database';
import { DeleteResult } from 'kysely';
import { AppUser, AppUserDB, ListUsers } from 'src/types/clientSchema';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';
import { BlockedUserService } from 'src/blocked-user/blocked-user.service';

@Injectable()
export class FriendsService {
  constructor(
    private usersStatusGateway: UsersStatusGateway,
    @Inject(forwardRef(() => BlockedUserService))
    private blockeduserService: BlockedUserService
  ) {}

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
      .values({'user1_id': sourceId, 'user2_id': targetId})
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

    // ? Check if nobody block the other person
    if (await this.blockeduserService.hasUserBlock(sourceId, targetId) || await this.blockeduserService.hasUserBlock(targetId, sourceId))
      throw new UnprocessableEntityException("Can't send a friend request to someone you block or to someone who blocked you");

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
      return [];

    let arrayRequestId: number[] = [];
    requestsId.forEach(requestId => {
      arrayRequestId.push(requestId.sourceId);
    });

    let requestUsers: ListUsers[];
    try {
      requestUsers = await db
      .selectFrom('user')
      .select(['id', 'username', 'avatarUrl'])
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
    try {
      const friends = await db
      .selectFrom('user')
      .where('id', '!=', id)
      .innerJoin('friend', (join) =>
        join.on(({eb, or, and}) => or([
          and([
            eb('friend.user1_id', '=', id),
            eb('friend.user2_id', '=', eb.ref('user.id'))
          ]),
          and([
            eb('friend.user1_id', '=', eb.ref('user.id')),
            eb('friend.user2_id', '=', id)
          ])
        ])),
      )
      .select(['user.avatarUrl', 'user.id', 'user.username', 'user.rating', 'user.bio', 'user.createdAt', 'user.email', 'user.firstname', 'user.lastname', 'user.isTwoFactorAuthenticationEnabled'])
      .execute();
      console.log(friends);
      return friends.map(u => ({
        ...u,
        status: this.usersStatusGateway.getUserStatus(u?.id)
      }));
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
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

      await db.deleteFrom("conversation").where((eb) => eb.or([
        eb.and([
          eb("conversation.user1_id", "=", selfId),
          eb("conversation.user2_id", "=", friendId),
        ]),
        eb.and([
          eb("conversation.user2_id", "=", selfId),
          eb("conversation.user1_id", "=", friendId),
        ])
      ])).execute();

    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
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

  async cancelFriendRequest(sourceId: number, targetId: number) {
    await db.deleteFrom("friendRequest").where("sourceId", "=", sourceId).where("targetId", "=", targetId).execute();
  }

  async getUserFriendsWithConversationId(userId: number, userToFindFriendOfId: number) {
    const friends = await db.selectFrom("friend").where((eb) => eb.or([
        eb("friend.user1_id", "=", userToFindFriendOfId),
        eb("friend.user2_id", "=", userToFindFriendOfId),
    ]))
    .innerJoin("user", (join) => join.on((eb) => eb.or([
        eb("user.id", "=", eb.ref("friend.user1_id")),
        eb("user.id", "=", eb.ref("friend.user2_id")),
    ]).and("user.id", "!=", userToFindFriendOfId)))
    .leftJoin("conversation", (join) => join.on((eb) => eb.or([
      eb.and([
        eb("conversation.user1_id", "=", eb.ref("user.id")),
        eb("conversation.user2_id", "=", userId),
      ]),
      eb.and([
        eb("conversation.user2_id", "=", eb.ref("user.id")),
        eb("conversation.user1_id", "=", userId),
      ])
    ])))
    .select("conversation.id as conversationId")
    .select(['user.avatarUrl', 'user.id', 'user.username', 'user.rating'])
    .orderBy("friend.createdAt desc")
    .execute();

    const friendsWithStatus = friends?.map((friend) => {
      return {
        ...friend,
        status: this.usersStatusGateway.getUserStatus(friend.id)
      }
    })
    return friendsWithStatus;
  }

  async getUserFriendRequests(userId: number) {
    const users = await db.selectFrom("friendRequest")
    .where("friendRequest.targetId", "=", userId)
    .innerJoin("user", "user.id", "friendRequest.sourceId")
    .select(["user.id", "user.username", "user.avatarUrl", "user.rating"])
    .execute();
    const requestsWithUserStatus = users.map((request) => {
      return {
        ...request,
        status: this.usersStatusGateway.getUserStatus(request.id)
      }
    })
    return requestsWithUserStatus;
  }
}

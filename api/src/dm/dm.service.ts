import { LiveChatSocket } from './../liveChatSocket/liveChatSocket.gateway';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { db } from 'src/database';
import {
  UserConversationType,
  DirectMessageContent,
  DmWithSenderInfo,
  UserConversation,
} from 'src/types/channelsSchema';
import { FriendsService } from 'src/friends/friends.service';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';
import { DirectMessage } from 'src/types/schema';
import { Selectable } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';

@Injectable()
export class DmService {
  constructor(
    private friendsService: FriendsService,
    private readonly liveChatSocket: LiveChatSocket,
    private readonly usersStatusGateway: UsersStatusGateway,
  ) {}

  //
  //
  //
  async findDmId(user1: number, user2: number): Promise<number> {
    try {
      const conversation = await db
        .selectFrom('conversation')
        .selectAll()
        .where((eb) =>
          eb.or([eb('user1_id', '=', user1), eb('user2_id', '=', user1)]),
        )
        .where((eb) =>
          eb.or([eb('user1_id', '=', user2), eb('user2_id', '=', user2)]),
        )
        .executeTakeFirstOrThrow();

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      return conversation.id;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async createConversation(user2: number, userId: number) {
    if (user2 == userId) {
      throw new UnprocessableEntityException(
        'Cannot create conversation with yourself',
      );
    }

    try {
      await this.userExists(user2);
    } catch (error) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.userIsBlocked(userId, user2);
    } catch (error) {
      throw error;
    }

    try {
      await this.userIsBlocked(user2, userId);
    } catch (error) {
      throw error;
    }

    if ((await this.friendsService.isFriend(userId, user2)) == false) {
      throw new NotFoundException('Users are not friends');
    }

    try {
      await this.getConversationByUserIds(userId, user2);
    } catch (error) {
      throw error;
    }

    const conversation = await db
      .insertInto('conversation')
      .values({
        user1_id: userId,
        user2_id: user2,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return conversation.id;

    // !!! test of the global socket that will notify the user about the new conversation
    // this.liveChatSocket.handleNewConversation(userId, user2);
    // return `Conversation of user ${userId} and user ${user2} created`;
  }

  async getAllConversationsOfTheUser(
    userId: number,
  ): Promise<UserConversationType[]> {
    try {
      const conversations = await db
        .selectFrom('conversation')
        .where((eb) =>
          eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]),
        )
        // select conversation other user
        .innerJoin('user', (join) =>
          join
            .on((eb) =>
              eb.or([
                eb('conversation.user1_id', '=', eb.ref('user.id')),
                eb('conversation.user2_id', '=', eb.ref('user.id')),
              ]),
            )
            .on('user.id', '!=', userId),
        )
        .select((eb) =>
          jsonBuildObject({
            id: eb.ref('user.id'),
            avatarUrl: eb.ref('user.avatarUrl'),
            username: eb.ref('user.username'),
            rating: eb.ref('user.rating'),
          }).as('user'),
        )
        .select(['conversation.id', 'conversation.createdAt'])
        .execute();

      return conversations.map((conv) => {
        return {
          ...conv,
          user: {
            ...conv.user,
            status: this.usersStatusGateway.getUserStatus(conv.user.id),
          },
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getConversationByUserIds(
    user1_id: number,
    user2_id: number,
  ): Promise<boolean> {
    try {
      const conversationExists = await db
        .selectFrom('conversation')
        .selectAll()
        .where((eb) =>
          eb.or([eb('user1_id', '=', user1_id), eb('user2_id', '=', user1_id)]),
        )
        .where((eb) =>
          eb.or([eb('user1_id', '=', user2_id), eb('user2_id', '=', user2_id)]),
        )
        .executeTakeFirst();

      if (conversationExists) {
        throw new NotFoundException('Conversation already exists');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getConversation(
    conversationId: number,
    userId: number,
  ): Promise<UserConversation> {
    try {
      const conversation = await db
        .selectFrom('conversation')
        .where('conversation.id', '=', conversationId)
        .innerJoin('user as member1', 'member1.id', 'conversation.user1_id')
        .innerJoin('user as member2', 'member2.id', 'conversation.user2_id')
        .leftJoin('blockedUser', (join) =>
          join.on((eb) =>
            eb.or([
              eb.and([
                eb('blockedUser.blockedById', '=', eb.ref('member1.id')),
                eb('blockedUser.blockedId', '=', eb.ref('member2.id')),
              ]),
              eb.and([
                eb('blockedUser.blockedById', '=', eb.ref('member2.id')),
                eb('blockedUser.blockedId', '=', eb.ref('member1.id')),
              ]),
            ]),
          ),
        )

        .select((eb) =>
          eb
            .case()
            .when('blockedUser.blockedId', 'is', null)
            .then(false)
            .else(true)
            .end()
            .as('isBlocked'),
        )

        .select((eb) =>
          jsonBuildObject({
            userId: eb.ref('member1.id'),
            avatarUrl: eb.ref('member1.avatarUrl'),
            username: eb.ref('member1.username'),
          }).as('user1'),
        )

        .select((eb) =>
          jsonBuildObject({
            userId: eb.ref('member2.id'),
            avatarUrl: eb.ref('member2.avatarUrl'),
            username: eb.ref('member2.username'),
          }).as('user2'),
        )

        .select((eb) =>
          eb
            .case()
            .when('blockedUser.blockedId', 'is', null)
            .then(false)
            .else(true)
            .end()
            .as('isBlocked'),
        )
        .select(['conversation.id', 'conversation.createdAt'])
        .executeTakeFirst();

      if (!conversation) throw new NotFoundException('Conversation not found');

      return conversation;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getConversationMessages(
    conversationId: number,
    userId: number,
  ): Promise<DmWithSenderInfo[]> {
    try {
      await this.getConversation(conversationId, userId);
    } catch (error) {
      throw error;
    }

    try {
      const messages = await db
        .selectFrom('directMessage')
        .selectAll()
        .where('conversationId', '=', conversationId)
        .orderBy('directMessage.createdAt', 'asc')
        .leftJoin('user', 'directMessage.senderId', 'user.id')
        .leftJoin('blockedUser', (join) =>
          join
            .onRef('blockedUser.blockedId', '=', 'directMessage.senderId')
            .on('blockedUser.blockedById', '=', userId),
        )
        .select([
          'directMessage.content',
          'directMessage.createdAt',
          'directMessage.id as messageId',
          'directMessage.senderId',
          'user.avatarUrl',
          'user.username',
          'blockedUser.blockedId',
        ])
        .execute();

      return messages.map((message) => ({
        content: message.content,
        conversationId: conversationId,
        createdAt: message.createdAt,
        messageId: message.messageId,
        senderId: message.senderId,
        avatarUrl: message.avatarUrl,
        username: message.username,
        senderIsBlocked: Boolean(message.blockedId),
      })) as DmWithSenderInfo[];
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async deleteConversation(
    conversationId: number,
    userId: number,
  ): Promise<void> {
    try {
      await db
        .deleteFrom('conversation')
        .where('id', '=', conversationId)
        .where((eb) =>
          eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]),
        )
        .execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async userExists(userId: number): Promise<void> {
    try {
      const user = await db
        .selectFrom('user')
        .select('id')
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      console.log('User exists', userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async conversationExists(conversationId: number): Promise<void> {
    try {
      const conversation = await db
        .selectFrom('conversation')
        .select('id')
        .where('id', '=', conversationId)
        .executeTakeFirstOrThrow();

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //Socket io method :

  //
  //
  //
  async createDirectMessage(
    directMessage: DirectMessageContent,
    senderId: number,
  ): Promise<Selectable<DirectMessage>> {
    // try {
    const message = await db
      .insertInto('directMessage')
      .values({
        content: directMessage.content,
        conversationId: directMessage.conversationId,
        senderId: senderId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return message;
    // console.log(`Message sent to ${directMessage.conversationId}`);
    // console.log('Direct Message:', directMessage);
    // } catch (error) {
    //   throw new InternalServerErrorException('Unable to send message');
    // }
  }

  //
  //
  //
  async userIsBlocked(user1: number, user2: number): Promise<void> {
    try {
      const users = await db
        .selectFrom('blockedUser')
        .select(['blockedId', 'blockedById'])
        .where('blockedId', '=', user1)
        .where('blockedById', '=', user2)
        .executeTakeFirst();

      if (users) {
        throw new UnauthorizedException(
          `User ${users.blockedById} blocked user ${users.blockedId}`,
        );
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async getConversationById(conversationId: number) {
    const conversation = await db
      .selectFrom('conversation')
      .where('id', '=', conversationId)
      .selectAll()
      .executeTakeFirst();
    return conversation;
  }

  async delete(conversationId: number) {
    await db
      .deleteFrom('conversation')
      .where('id', '=', conversationId)
      .execute();
  }
}

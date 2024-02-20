import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { db } from 'src/database';
import {
  ConversationPromise,
  DirectMessageContent,
  DmWithSenderInfo,
} from 'src/types/channelsSchema';
import { FriendsService } from 'src/friends/friends.service';

@Injectable()
export class DmService {
  constructor(private friendsService: FriendsService) {}

  //
  //
  //
  async createConversation(user2: number, userId: number): Promise<string> {
    if (user2 === userId) {
      throw new UnprocessableEntityException(
        'Cannot create conversation with yourself',
      );
    }

    try {
      await this.userExists(user2);
    } catch (error) {
      console.error(error);
      throw new NotFoundException('User not found');
    }

    // !!! to test
    if ((await this.friendsService.isFriend(userId, user2)) === false) {
      throw new NotFoundException('Users are not friends');
    }

    if (await this.getConversationByUserIds(userId, user2)) {
      throw new ConflictException('Conversation already exists');
    }

    try {
      await db
        .insertInto('conversation')
        .values({
          user1_id: userId,
          user2_id: user2,
        })
        .execute();
      console.log(`Conversation created for ${userId} and ${user2}`);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }

    return `Conversation of user ${userId} and user ${user2} created`;
  }

  //
  //
  //
  async getConversationByUserIds(
    user1_id: number,
    user2_id: number,
  ): Promise<ConversationPromise> {
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
      return conversationExists as ConversationPromise;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getAllConversationsOfTheUser(
    userId: number,
  ): Promise<ConversationPromise[]> {
    try {
      const allConv = await db
        .selectFrom('conversation')
        .selectAll()
        .where((eb) =>
          eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]),
        )
        .execute();
      if (!allConv || allConv.length === 0) {
        throw new NotFoundException('No conversations found for this user');
      }

      return allConv as ConversationPromise[];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getConversation(
    id: number,
    userId: number,
  ): Promise<ConversationPromise> {
    try {
      const conversation = await db
        .selectFrom('conversation')
        .selectAll()
        .where('id', '=', id)
        .where((eb) =>
          eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]),
        )
        .executeTakeFirst();
      if (!conversation) throw new NotFoundException('Conversation not found');

      return conversation as ConversationPromise;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async deleteConversation(id: number, userId: number): Promise<string> {
    try {
      const deletedResult = await db
        .deleteFrom('conversation')
        .where('id', '=', id)
        .where((eb) =>
          eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]),
        )
        .executeTakeFirst();

      const numDeletedRows = deletedResult.numDeletedRows;
      if (numDeletedRows === 0n) {
        throw new NotFoundException('Conversation not found');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
    return `Conversation ${id} deleted`;
  }

  //
  //
  //
  async getConversationMessages(
    id: number,
    userId: number,
  ): Promise<DmWithSenderInfo[]> {
    const userIsInConversation = await this.getConversation(id, userId);
    if (!userIsInConversation) {
      throw new NotFoundException('Conversation not found');
    }

    try {
      const messages = await db
        .selectFrom('directMessage')
        .selectAll()
        .where('conversationId', '=', id)
        .orderBy('directMessage.createdAt', 'asc')
        .leftJoin('user', 'directMessage.senderId', 'user.id')
        .select([
          'directMessage.content',
          'directMessage.createdAt',
          'directMessage.id as messageId',
          'directMessage.senderId',
          'user.avatarUrl',
          'user.username',
        ])
        .execute();

      if (messages.length === 0) {
        throw new NotFoundException('No messages found');
      }

      return messages.map((message) => ({
        content: message.content,
        conversationId: id,
        createdAt: message.createdAt,
        messageId: message.messageId,
        senderId: message.senderId,
        avatarUrl: message.avatarUrl || null,
        username: message.username || null,
      })) as DmWithSenderInfo[];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  //Socket io methods :

  //
  //
  //
  async createDirectMessage(directMessage: DirectMessageContent) {
    try {
      await db
        .insertInto('directMessage')
        .values({
          content: directMessage.content,
          conversationId: directMessage.conversationId,
          senderId: directMessage.senderId,
        })
        .execute();
      console.log(`Message sent to ${directMessage.conversationId}`);
      console.log('Direct Message:', directMessage);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Unable to send message');
    }
  }

  //
  //
  //
  async userExists(userId: number): Promise<void> {
    try {
      await db
        .selectFrom('user')
        .select('id')
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      console.log('User exists', userId);
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  //
  //
  //
  async conversationExists(conversationId: number): Promise<void> {
    try {
      await db
        .selectFrom('conversation')
        .select('id')
        .where('id', '=', conversationId)
        .executeTakeFirstOrThrow();
    } catch (error) {
      throw new NotFoundException('Channel not found');
    }
  }
}

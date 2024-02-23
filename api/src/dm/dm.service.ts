import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Conversation } from '../types/schema';
import { db } from 'src/database';
import {
  ConnectToDm,
  DirectMessageContent,
  DmWithSenderInfo,
} from 'src/types/channelsSchema';
import { DeleteResult } from 'kysely';

@Injectable()
export class DmService {
  //
  //
  //
  async createConversation(
    user2: number,
    userId: number,
  ): Promise<Conversation> {
    if (user2 === userId) {
      throw new UnprocessableEntityException(
        'Cannot create conversation with yourself',
      );
    }

    try {
      await this.userExists(userId);
      await this.userExists(user2);
    } catch (error) {
      console.error(error);
      throw new NotFoundException('User not found');
    }

    try {
      await db
        .selectFrom('friend')
        .where(({ eb, or, and }) => or([
          and([
            eb('user1_id', '=', userId),
            eb('user2_id', '=', user2),
          ]),
          and([
            eb('user1_id', '=', user2),
            eb('user2_id', '=', userId),
          ])
        ]))
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.error(error);
      throw new NotFoundException('Users are not friends');
    }

    if (await this.getConversationByUserIds(userId, user2)) {
      throw new UnprocessableEntityException('Conversation already exists');
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

    return this.getConversationByUserIds(userId, user2);
  }

  //
  //
  //
  async getConversationByUserIds(
    user1_id: number,
    user2_id: number,
  ): Promise<Conversation> {
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
      return conversationExists as unknown as Conversation;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getAllConversationsOfTheUser(userId: number): Promise<Conversation[]> {
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

      return allConv as unknown as Conversation[];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  async getConversation(id: number, userId: number): Promise<Conversation> {
    try {
      const conversation = await db
        .selectFrom('conversation')
        .selectAll()
        .where('id', '=', id)
        .where((eb) =>
          eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]),
        )
        .execute();
      if (!conversation) throw new NotFoundException('Conversation not found');
      return conversation as unknown as Conversation;
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

      const numDeletedRows = deletedResult[0]?.numDeletedRows || 0;
      if (numDeletedRows <= 0) {
        throw new NotFoundException('Conversation not found');
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }

    try {
      await db
        .deleteFrom('directMessage')
        .where('conversationId', '=', id)
        .execute();

      return `Conversation ${id} deleted`;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
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
      })) as unknown as DmWithSenderInfo[];
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

  //
  //
  //
  async quitConversation(payload: ConnectToDm) {
    let userIsDeleted: DeleteResult;
    try {
      userIsDeleted = await db
        .deleteFrom('conversation')
        .where('id', '=', payload.conversationId)
        .where((eb) =>
          eb.or([
            eb('user1_id', '=', payload.userId),
            eb('user2_id', '=', payload.userId),
          ]),
        )
        .executeTakeFirst();

      console.log('User is deleted from conversation:', userIsDeleted);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }

    if (userIsDeleted[0]?.numDeletedRows === 0n) {
      try {
        await db
          .deleteFrom('conversation')
          .where('id', '=', payload.conversationId)
          .execute();

        await db
          .deleteFrom('directMessage')
          .where('conversationId', '=', payload.conversationId)
          .execute();
        console.log('Conversation deleted');
      } catch (error) {
        console.error(error);
        throw new InternalServerErrorException();
      }
    }
  }
}

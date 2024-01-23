import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { ChannelMessage } from '../types/schema';
import { DB } from '../types/schema';

@Injectable()
export class ChatService {
  private db: Kysely<DB>; // Define a Database interface that includes all entities

  constructor(@Inject('DATABASE_CONNECTION') db: Kysely<DB>) {
    this.db = db;
  }

  //// FOR TESTS
  async getAllUsers(): Promise<any> {
    try {
      const users = await this.db.selectFrom('user').selectAll().execute();
      console.log(users, 'done');
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
  ////

  async createMessage(message: ChannelMessage): Promise<void> {
    console.log('createMessage');
    try {
      console.log('createMessage');
      await this.db
        .insertInto('channelMessage')
        .values({
          channelId: message.channelId,
          content: message.content,
          senderId: message.senderId,
          // createdAt: new Date(),
        })
        .execute();
      console.log('Msg added');
    } catch (error) {
      console.error('Error creating message:', error);
    }
  }

  async addClient(channelId: number, userId: number): Promise<void> {
    console.log('addClient');
    try {
      await this.db.transaction().execute(async (trx) => {
        const exists = await trx
          .selectFrom('channelMember')
          .select('userId')
          .where('userId', '=', userId)
          .executeTakeFirst();

        if (!exists) {
          await trx
            .insertInto('channelMember')
            .values({
              channelId: channelId,
              // joinedAt: new Date(),
              userId: userId,
            })
            .execute();
          console.log('Client added:', userId);
        }
      });
    } catch (error) {
      console.error('Error adding client:', error);
    }
  }

  async removeClient(id: number): Promise<void> {
    console.log('removeClient');
    if (!id) {
      return;
    }
    try {
      await this.db
        .deleteFrom('channelMember')
        .where('userId', '=', id)
        .execute();
    } catch (error) {
      console.error('Error removing client:', error);
    }
  }

  private storedId: number;
  setStoredId(id: number): void {
    this.storedId = id;
    console.log('userId:', this.storedId);
  }

  getStoredId(): number {
    return this.storedId;
  }

  private storedChannelId: number;
  setStoredChannelId(id: number): void {
    this.storedChannelId = id;
  }

  getStoredChannelId(): number {
    return this.storedChannelId;
  }

  async getMessages(channelId: number): Promise<ChannelMessage[]> {
    console.log('getMessages');
    try {
      const messages: any[] = await this.db
        .selectFrom('channelMessage')
        .select(['channelId', 'content', 'createdAt', 'id', 'senderId'])
        .where('channelId', '=', channelId)
        .orderBy('createdAt', 'asc')
        .execute();

      return messages.map((message) => ({
        channelId: message.channelId,
        content: message.content,
        createdAt: message.createdAt,
        id: message.id,
        senderId: message.senderId,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Error fetching messages');
    }
  }

  async addChannel(channelId: number): Promise<number> {
    console.log('addChannel');
    try {
      await this.db.transaction().execute(async (trx) => {
        const exists = await trx
          .selectFrom('channel')
          .select('id')
          .where('id', '=', channelId)
          .executeTakeFirst();

        if (!exists) {
          await trx
            .insertInto('channel')
            .values({
              channelOwner: 1, // !!! TODO CHANOWNER
              id: channelId,
            })
            .execute();
          console.log('Channel added:', channelId);
        }
      });
    } catch (error) {
      console.error('Error adding channel:', error);
    }
    return channelId;
  }
}

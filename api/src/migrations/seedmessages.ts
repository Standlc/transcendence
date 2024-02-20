import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from '../types/schema';

dotenv.config();
const dialect = new PostgresDialect({
  pool: new Pool(),
});

const db = new Kysely<DB>({
  dialect,
});

async function seed() {
  try {
    await db
      .insertInto('channelMessage')
      .values([
        {
          senderId: 1,
          channelId: 1,
          content: 'Message from User 1 to Channel 1',
          createdAt: new Date(),
        },
        {
          senderId: 2,
          channelId: 1,
          content: 'Message from User 2 to Channel 1',
          createdAt: new Date(),
        },
        {
          senderId: 3,
          channelId: 1,
          content: 'Message from User 3 to Channel 1',
          createdAt: new Date(),
        },
        {
          senderId: 4,
          channelId: 1,
          content: 'Message from User 4 to Channel 1',
          createdAt: new Date(),
        },
        {
          senderId: 5,
          channelId: 1,
          content: 'Message from User 5 to Channel 1',
          createdAt: new Date(),
        },
      ])
      .execute();
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

seed();

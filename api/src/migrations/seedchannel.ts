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
      .insertInto('channel')
      .values({
        channelOwner: 1,
        isPublic: true,
        name: 'abc',
        password: null,
        photoUrl: null,
      })
      .execute();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
  try {
    await db
      .insertInto('conversation')
      .values({
        user1_id: 1,
        user2_id: 2,
      })
      .execute();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
  await db.destroy();
}

seed();

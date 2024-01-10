import * as bcrypt from 'bcrypt';
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
  const hashedPassword = await bcrypt.hash('123', 10);

  try {
    await db
      .insertInto('user')
      .values([
        {
          username: 'john',
          password: hashedPassword,
          bio: 'Hey this is my bio!',
        },
        {
          username: 'jack',
          password: hashedPassword,
          bio: 'Hey this is my bio!',
        },
        {
          username: 'elton',
          password: hashedPassword,
          bio: 'Hey this is my bio!',
        },
        {
          username: 'jimmy',
          password: hashedPassword,
          bio: 'Hey this is my bio!',
        },
        {
          username: 'joe',
          password: hashedPassword,
          bio: 'Hey this is my bio!',
        },
      ])
      .execute();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  await db.destroy();
}

seed();

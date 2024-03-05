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

const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash('123', 10);

  const users = await db.selectFrom('user').execute();
  if (users.length) {
    return;
  }

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
};

async function seedChannels() {
  const channels = await db.selectFrom('channel').execute();
  if (channels.length) {
    return;
  }

  await db
    .insertInto('channel')
    .values([
      {
        channelOwner: 1,
        isPublic: true,
        name: 'The Social Network',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 2,
        isPublic: true,
        name: 'Pong Pong',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 3,
        isPublic: true,
        name: 'Hippies',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 4,
        isPublic: true,
        name: 'Yeye',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 5,
        isPublic: true,
        name: 'Pong Club',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 1,
        isPublic: true,
        name: '42',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 1,
        isPublic: true,
        name: 'Lofi',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 2,
        isPublic: true,
        name: 'Sapiens',
        password: null,
        photoUrl: null,
      },
    ])
    .execute();
}

async function seedChannelMembers() {
  const channelMembers = await db.selectFrom('channelMember').execute();
  if (channelMembers.length) {
    return;
  }

  await db
    .insertInto('channelMember')
    .values([
      {
        channelId: 1,
        userId: 1,
      },
      {
        channelId: 2,
        userId: 1,
      },
      {
        channelId: 3,
        userId: 1,
      },
      {
        channelId: 4,
        userId: 1,
      },
      {
        channelId: 5,
        userId: 1,
      },
      {
        channelId: 1,
        userId: 2,
      },
      {
        channelId: 2,
        userId: 2,
      },
      {
        channelId: 3,
        userId: 2,
      },
      {
        channelId: 4,
        userId: 2,
      },
      {
        channelId: 5,
        userId: 2,
      },
      {
        channelId: 1,
        userId: 3,
      },
      {
        channelId: 2,
        userId: 3,
      },
      {
        channelId: 3,
        userId: 3,
      },
      {
        channelId: 4,
        userId: 3,
      },
      {
        channelId: 5,
        userId: 3,
      },
      {
        channelId: 6,
        userId: 3,
      },
      {
        channelId: 4,
        userId: 4,
      },
      {
        channelId: 4,
        userId: 5,
      },
      {
        channelId: 5,
        userId: 5,
      },
    ])
    .execute();
}

const seedChannelAdmins = async () => {
  const channelAdmins = await db.selectFrom('channelAdmin').execute();
  if (channelAdmins.length) {
    return;
  }

  await db
    .insertInto('channelAdmin')
    .values([
      {
        channelId: 1,
        userId: 2,
      },
      {
        channelId: 2,
        userId: 1,
      },
      {
        channelId: 3,
        userId: 2,
      },
      {
        channelId: 4,
        userId: 2,
      },
    ])
    .execute();
};

async function seed() {
  await seedUsers();
  await seedChannels();
  await seedChannelMembers();
  await seedChannelAdmins();
  await db.destroy();
}

try {
  seed();
} catch (error) {
  console.log(error);
  db.destroy();
}

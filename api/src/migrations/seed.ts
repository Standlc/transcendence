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
        rating: 1203,
      },
      {
        username: 'jack',
        password: hashedPassword,
        bio: 'Hey this is my bio!',
        rating: 678,
      },
      {
        username: 'elton',
        password: hashedPassword,
        bio: 'Hey this is my bio!',
        rating: 425,
      },
      {
        username: 'jimmy',
        password: hashedPassword,
        bio: 'Hey this is my bio!',
        rating: 2130,
      },
      {
        username: 'joe',
        password: hashedPassword,
        bio: 'Lorem ipsum!',
      },
      {
        username: 'jay',
        password: hashedPassword,
        bio: "Hey this is my bio! I'm jay btw",
      },
    ])
    .execute();
};

const seedFriends = async () => {
  const friends = await db.selectFrom('friend').execute();
  if (friends.length) {
    return;
  }

  await db
    .insertInto('friend')
    .values([
      // user 1 friends
      {
        user1_id: 1,
        user2_id: 2,
      },
      {
        user1_id: 1,
        user2_id: 3,
      },
      {
        user1_id: 1,
        user2_id: 4,
      },
      {
        user1_id: 1,
        user2_id: 5,
      },
      {
        user1_id: 1,
        user2_id: 6,
      },
      // user 2 friends
      {
        user1_id: 2,
        user2_id: 3,
      },
      {
        user1_id: 2,
        user2_id: 4,
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
        name: 'Pong Club',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 5,
        isPublic: true,
        name: '42',
        password: null,
        photoUrl: null,
      },
      {
        channelOwner: 6,
        isPublic: true,
        name: 'Lofi',
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
      // channel owners
      {
        channelId: 1,
        userId: 1,
      },
      {
        channelId: 2,
        userId: 2,
      },
      {
        channelId: 3,
        userId: 3,
      },
      {
        channelId: 4,
        userId: 4,
      },
      {
        channelId: 5,
        userId: 5,
      },
      {
        channelId: 6,
        userId: 6,
      },
      // other members channel 1
      {
        channelId: 1,
        userId: 2,
      },
      {
        channelId: 1,
        userId: 3,
      },
      {
        channelId: 1,
        userId: 4,
      },
      {
        channelId: 1,
        userId: 5,
      },
      {
        channelId: 1,
        userId: 6,
      },
      // other members channel 2
      {
        channelId: 2,
        userId: 1,
      },
      // other members channel 3
      {
        channelId: 3,
        userId: 1,
      },
      {
        channelId: 3,
        userId: 2,
      },
      // other members channel 4
      {
        channelId: 4,
        userId: 1,
      },
      {
        channelId: 4,
        userId: 2,
      },
      {
        channelId: 4,
        userId: 3,
      },
      // other members channel 5
      {
        channelId: 5,
        userId: 1,
      },
      {
        channelId: 5,
        userId: 2,
      },
      {
        channelId: 5,
        userId: 3,
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

const seedGames = async () => {
  const games = await db.selectFrom('game').execute();
  if (games.length) {
    return;
  }

  await db
    .insertInto('game')
    .values([
      // player 1 & 2
      {
        isPublic: true,
        playerOneId: 1,
        playerTwoId: 2,
        playerOneRatingChange: 33,
        playerTwoRatingChange: -33,
        playerOneScore: 10,
        playerTwoScore: 4,
        points: 10,
        powerUps: false,
        winnerId: 1,
      },
      {
        isPublic: true,
        playerOneId: 1,
        playerTwoId: 2,
        playerOneRatingChange: 22,
        playerTwoRatingChange: -22,
        playerOneScore: 10,
        playerTwoScore: 6,
        points: 10,
        powerUps: false,
        winnerId: 2,
      },
      {
        isPublic: true,
        playerOneId: 1,
        playerTwoId: 2,
        playerOneRatingChange: -8,
        playerTwoRatingChange: 8,
        playerOneScore: 8,
        playerTwoScore: 10,
        points: 10,
        powerUps: false,
        winnerId: 2,
      },
      // player 1 & 4
      {
        isPublic: true,
        playerOneId: 1,
        playerTwoId: 4,
        playerOneScore: 0,
        playerTwoScore: 21,
        playerOneRatingChange: -64,
        playerTwoRatingChange: 64,
        points: 21,
        powerUps: false,
        winnerId: 2,
      },
    ])
    .execute();
};

async function seed() {
  try {
    await seedUsers();
    await seedFriends();
    await seedChannels();
    await seedChannelMembers();
    await seedChannelAdmins();
    await seedGames();
  } catch (error) {
    await db.deleteFrom('user').execute();
  }
  await db.destroy();
}

try {
  seed();
} catch (error) {
  console.log(error);
  db.destroy();
}

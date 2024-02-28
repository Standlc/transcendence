import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  /**
   * Droping foreign keys
   */
  await db.schema
    .alterTable('game')
    .dropConstraint('game_playerOneId_fkey')
    .execute();

  await db.schema
    .alterTable('game')
    .dropConstraint('game_playerTwoId_fkey')
    .execute();

  await db.schema
    .alterTable('game')
    .dropConstraint('game_winnerId_fkey')
    .execute();

  /**
   * Add 'ON DELETE CASCADE' to userId's foreign keys
   */
  await db.schema
    .alterTable('game')
    .addForeignKeyConstraint('game_playerOneId_fkey', ['playerOneId'], 'user', [
      'id',
    ])
    .onDelete('cascade')
    .execute();

  await db.schema
    .alterTable('game')
    .addForeignKeyConstraint('game_playerTwoId_fkey', ['playerTwoId'], 'user', [
      'id',
    ])
    .onDelete('cascade')
    .execute();

  await db.schema
    .alterTable('game')
    .addForeignKeyConstraint('game_winnerId_fkey', ['winnerId'], 'user', ['id'])
    .onDelete('cascade')
    .execute();

  /**
   * Rename publicGameRequest to gameRequest (targetId is optional)
   */
  await db.schema
    .alterTable('publicGameRequest')
    .renameTo('gameRequest')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('game')
    .dropConstraint('game_playerOneId_fkey')
    .execute();

  await db.schema
    .alterTable('game')
    .dropConstraint('game_playerTwoId_fkey')
    .execute();

  await db.schema
    .alterTable('game')
    .dropConstraint('game_winnerId_fkey')
    .execute();

  await db.schema
    .alterTable('game')
    .addForeignKeyConstraint('game_playerOneId_fkey', ['playerOneId'], 'user', [
      'id',
    ])
    .execute();

  await db.schema
    .alterTable('game')
    .addForeignKeyConstraint('game_playerTwoId_fkey', ['playerOneId'], 'user', [
      'id',
    ])
    .execute();

  await db.schema
    .alterTable('game')
    .addForeignKeyConstraint('game_winnerId_fkey', ['winnerId'], 'user', ['id'])
    .execute();

  await db.schema
    .alterTable('gameRequest')
    .renameTo('publicGameRequest')
    .execute();
}

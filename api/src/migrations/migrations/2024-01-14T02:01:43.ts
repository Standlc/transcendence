import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // await db.schema
  //   .createTable('player')
  //   .addColumn('userId', 'integer', (col) =>
  //     col.references('user.id').notNull(),
  //   )
  //   .addColumn('gameId', 'integer', (col) =>
  //     col.references('game.id').onDelete('cascade').notNull(),
  //   )
  //   .addColumn('score', 'integer', (col) => col.notNull().defaultTo(0))
  //   .addPrimaryKeyConstraint('playerPrimaryKey', ['userId', 'gameId'])
  //   .execute();

  await db.schema
    .alterTable('game')
    .dropColumn('player1_id')
    .dropColumn('player2_id')
    .dropColumn('player1_score')
    .dropColumn('player2_score')

    .addColumn('playerOneId', 'integer', (col) =>
      col.references('user.id').notNull(),
    )
    .addColumn('playerTwoId', 'integer', (col) =>
      col.references('user.id').notNull(),
    )
    .addColumn('playerOneScore', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('playerTwoScore', 'integer', (col) => col.notNull().defaultTo(0))

    .alterColumn('isPublic', (col) => col.dropDefault())
    .alterColumn('isPublic', (col) => col.setNotNull())
    .addColumn('powerUps', 'boolean', (col) => col.notNull())
    .addColumn('points', 'integer', (col) => col.notNull())
    .execute();

  await db.schema
    .alterTable('user')
    .addColumn('rating', 'integer', (col) => col.defaultTo(500).notNull())
    .execute();

  await db.schema
    .alterTable('publicGameRequest')
    .addColumn('targetId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade'),
    )
    .addColumn('powerUps', 'boolean', (col) => col.notNull())
    .addColumn('points', 'integer', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('game')
    .dropColumn('playerOneId')
    .dropColumn('playerTwoId')
    .dropColumn('playerOneScore')
    .dropColumn('playerTwoScore')
    .addColumn('player1_id', 'integer', (col) => col.references('user.id'))
    .addColumn('player2_id', 'integer', (col) => col.references('user.id'))
    .addColumn('player1_score', 'integer')
    .addColumn('player2_score', 'integer')
    .alterColumn('isPublic', (col) => col.setDefault('true'))
    .alterColumn('isPublic', (col) => col.dropNotNull())
    .dropColumn('powerUps')
    .dropColumn('points')
    .execute();

  await db.schema.alterTable('user').dropColumn('rating').execute();

  await db.schema
    .alterTable('publicGameRequest')
    .dropColumn('targetId')
    .dropColumn('powerUps')
    .dropColumn('points')
    .execute();

  // await db.schema.dropTable('player').execute();
}

import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  /**
   * Create Achievement table
   */
  await db.schema
    .createTable('achievement')
    .addColumn('type', 'integer', (col) => col.notNull())
    .addColumn('userId', 'integer', (col) =>
      col.references('user.id').notNull().onDelete('cascade'),
    )
    .addColumn('level', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updatedAt', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addPrimaryKeyConstraint('userAchievementPrimaryKey', ['type', 'userId'])
    .execute();

  /**
   * Add players's scores change to Game table
   */
  await db.schema
    .alterTable('game')
    .addColumn('playerOneRatingChange', 'integer', (col) =>
      col.defaultTo(0).notNull(),
    )
    .addColumn('playerTwoRatingChange', 'integer', (col) =>
      col.defaultTo(0).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('achievement').execute();

  await db.schema
    .alterTable('game')
    .dropColumn('playerOneRatingChange')
    .dropColumn('playerTwoRatingChange')
    .execute();
}

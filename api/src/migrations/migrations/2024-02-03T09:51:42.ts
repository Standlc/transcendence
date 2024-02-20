import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bannedUser')
    .addColumn('bannedById', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('bannedId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('channelId', 'integer', (col) =>
      col.references('channel.id').onDelete('cascade').notNull(),
    )
    .addPrimaryKeyConstraint('bannedPrimaryKey', ['bannedById', 'bannedId'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bannedUser').execute();
}

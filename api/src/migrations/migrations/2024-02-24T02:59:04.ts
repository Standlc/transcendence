import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('channelInviteList')
    .addColumn('invitedUserId', 'integer')
    .addColumn('invitedByUserId', 'integer')
    .addColumn('channelId', 'integer')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('channelInviteList').execute();
}

import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('channelAdmin').execute();
  await db.schema.dropTable('channelInviteList').execute();
  await db.schema.dropTable('mutedUser').execute();

  await db.schema
    .alterTable('channelMember')
    .addColumn('isAdmin', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('mutedEnd', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('channelAdmin')
    .addColumn('userId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('channelId', 'integer', (col) =>
      col.references('channel.id').onDelete('cascade').notNull(),
    )
    .addPrimaryKeyConstraint('channelAdminPrimaryKey', ['userId', 'channelId'])
    .execute();

  await db.schema
    .createTable('channelInviteList')
    .addColumn('invitedUserId', 'integer')
    .addColumn('invitedByUserId', 'integer')
    .addColumn('channelId', 'integer')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('mutedUser')
    .addColumn('userId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('channelId', 'integer', (col) =>
      col.references('channel.id').onDelete('cascade').notNull(),
    )
    .addColumn('mutedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('mutedEnd', 'timestamp', (col) => col.notNull())
    .addPrimaryKeyConstraint('mutedUserPrimaryKey', ['userId', 'channelId'])
    .execute();
}

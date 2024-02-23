import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('friend')
    .addColumn('user1_id', 'integer')
    .addColumn('user2_id', 'integer')
    .dropColumn('friendId')
    .dropColumn('userId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('friend')
    .dropColumn('user1_id')
    .dropColumn('user2_id')
    .addColumn('friendId', 'integer')
    .addColumn('userId', 'integer')
    .execute();
}

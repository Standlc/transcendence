import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channel')
    .alterColumn('name', (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channel')
    .alterColumn('name', (col) => col.dropNotNull())
    .execute();
}

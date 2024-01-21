import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('game')
    .alterColumn('player1_id', (col) => col.setNotNull())
    .alterColumn('player2_id', (col) => col.setNotNull())
    .alterColumn('player1_score', (col) => col.setNotNull())
    .alterColumn('player2_score', (col) => col.setNotNull())
    .alterColumn('isPublic', (col) => col.dropDefault())
    .alterColumn('isPublic', (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable('user')
    .addColumn('rating', 'integer', (col) => col.defaultTo(500).notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('game')
    .alterColumn('player1_id', (col) => col.dropNotNull())
    .alterColumn('player2_id', (col) => col.dropNotNull())
    .alterColumn('player1_score', (col) => col.dropNotNull())
    .alterColumn('player2_score', (col) => col.dropNotNull())
    .alterColumn('isPublic', (col) => col.setDefault('true'))
    .alterColumn('isPublic', (col) => col.dropNotNull())
    .execute();

  await db.schema.alterTable('user').dropColumn('rating').execute();
}

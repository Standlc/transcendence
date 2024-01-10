import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .addColumn('firstname', 'varchar(50)')
    .addColumn('lastname', 'varchar(50)')
    .addColumn('email', 'varchar(50)')
    .execute();

  await db.schema
    .alterTable('game')
    .addColumn('isPublic', 'boolean', (col) => col.defaultTo('true').notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .dropColumn('firstname')
    .dropColumn('lastname')
    .dropColumn('email')
    .execute();
}

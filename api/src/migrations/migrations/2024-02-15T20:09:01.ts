import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channel')
    .alterColumn('password', (ac) => ac.setDataType('varchar(255)'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channel')
    .alterColumn('password', (ac) => ac.setDataType('varchar(50)'))
    .execute();
}

import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .addColumn('isTwoFactorAuthenticationEnabled', 'boolean', (col) => col.defaultTo('false').notNull())
    .addColumn('TwoFactorAuthenticationSecret', 'varchar(100)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .dropColumn('isTwoFactorAuthenticationEnabled')
    .dropColumn('TwoFactorAuthenticationSecret')
    .execute()
}

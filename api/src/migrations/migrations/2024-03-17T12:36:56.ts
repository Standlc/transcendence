import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // remove 'bannedId' & 'bannedById' constraint
  await db.schema
    .alterTable('bannedUser')
    .dropConstraint('bannedPrimaryKey')
    .cascade()
    .execute();

  // add 'bannedId' & 'bannedById' & 'channeldId' constraint
  await db.schema
    .alterTable('bannedUser')
    .addPrimaryKeyConstraint('bannedPrimaryKey', [
      'bannedById',
      'bannedId',
      'channelId',
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // remove 'bannedId' & 'bannedById' & 'channeldId' constraint
  await db.schema
    .alterTable('bannedUser')
    .dropConstraint('bannedPrimaryKey')
    .cascade()
    .execute();

  // add 'bannedId' & 'bannedById' constraint
  await db.schema
    .alterTable('bannedUser')
    .addPrimaryKeyConstraint('bannedPrimaryKey', ['bannedById', 'bannedId'])
    .execute();
}

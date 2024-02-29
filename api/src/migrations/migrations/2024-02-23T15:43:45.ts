import { Kysely } from 'kysely';

/**
 * Changing the timestamps from "timestamp" to "timestamptz"
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('blockedUser')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('friend')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('friendRequest')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('channel')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('channelMember')
    .alterColumn('joinedAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('channelMessage')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('mutedUser')
    .alterColumn('mutedAt', (ac) => ac.setDataType('timestamptz'))
    .alterColumn('mutedEnd', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('conversation')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('directMessage')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('game')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('privateGameRequest')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('publicGameRequest')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();

  await db.schema
    .alterTable('bannedUser')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamptz'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('blockedUser')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('friend')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('friendRequest')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('channel')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('channelMember')
    .alterColumn('joinedAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('channelMessage')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('mutedUser')
    .alterColumn('mutedAt', (ac) => ac.setDataType('timestamp'))
    .alterColumn('mutedEnd', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('conversation')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('directMessage')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('game')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('privateGameRequest')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('publicGameRequest')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();

  await db.schema
    .alterTable('bannedUser')
    .alterColumn('createdAt', (ac) => ac.setDataType('timestamp'))
    .execute();
}

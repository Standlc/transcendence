import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  /**
   *
   * USER
   */
  await db.schema
    .createTable('user')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('username', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('password', 'varchar(255)', (col) => col.notNull())
    .addColumn('avatarUrl', 'varchar(255)')
    .addColumn('bio', 'text')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('blockedUser')
    .addColumn('blockedById', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('blockedId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addPrimaryKeyConstraint('blockedPrimaryKey', ['blockedById', 'blockedId'])
    .execute();

  /**
   *
   * FRIEND REQUEST
   */
  await db.schema
    .createTable('friend')
    .addColumn('userId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('friendId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addPrimaryKeyConstraint('friendPrimaryKey', ['userId', 'friendId'])
    .execute();

  await db.schema
    .createTable('friendRequest')
    .addColumn('sourceId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('targetId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addPrimaryKeyConstraint('friendRequestPrimaryKey', [
      'sourceId',
      'targetId',
    ])
    .execute();

  /**
   *
   * CHANNEL
   */
  await db.schema
    .createTable('channel')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(50)')
    .addColumn('photoUrl', 'varchar(50)')
    .addColumn('isPublic', 'boolean', (col) => col.defaultTo('true').notNull())
    .addColumn('password', 'varchar(50)') // !!! change to varchar(255)
    .addColumn('channelOwner', 'integer', (col) =>
      col.references('user.id').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

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
    .createTable('channelMember')
    .addColumn('userId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('channelId', 'integer', (col) =>
      col.references('channel.id').onDelete('cascade').notNull(),
    )
    .addColumn('joinedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addPrimaryKeyConstraint('channelMemberPrimaryKey', ['userId', 'channelId'])
    .execute();

  await db.schema
    .createTable('channelMessage')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('senderId', 'integer', (col) =>
      col.references('user.id').notNull(),
    )
    .addColumn('channelId', 'integer', (col) =>
      col.references('channel.id').onDelete('cascade').notNull(),
    )
    .addColumn('content', 'text')
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

  /**
   *
   * DIRECT CONVERSATION
   */
  await db.schema
    .createTable('conversation')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user1_id', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('user2_id', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('directMessage')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('senderId', 'integer', (col) =>
      col.references('user.id').notNull(),
    )
    .addColumn('conversationId', 'integer', (col) =>
      col.references('conversation.id').onDelete('cascade').notNull(),
    )
    .addColumn('content', 'text')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  /**
   *
   * GAME
   */
  await db.schema
    .createTable('game')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('player1_id', 'integer', (col) => col.references('user.id'))
    .addColumn('player2_id', 'integer', (col) => col.references('user.id'))
    .addColumn('player1_score', 'integer')
    .addColumn('player2_score', 'integer')
    .addColumn('winnerId', 'integer', (col) => col.references('user.id'))
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createTable('privateGameRequest')
    .addColumn('userId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('targetId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addPrimaryKeyConstraint('privateGameRequestPrimaryKey', [
      'userId',
      'targetId',
    ])
    .execute();

  await db.schema
    .createTable('publicGameRequest')
    .addColumn('userId', 'integer', (col) =>
      col.references('user.id').onDelete('cascade').primaryKey(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user').execute();
  await db.schema.dropTable('blockedUser').execute();
  await db.schema.dropTable('friend').execute();
  await db.schema.dropTable('friendRequest').execute();

  await db.schema.dropTable('channel').execute();
  await db.schema.dropTable('channelAdmin').execute();
  await db.schema.dropTable('channelMember').execute();
  await db.schema.dropTable('channelMessage').execute();
  await db.schema.dropTable('mutedUser').execute();

  await db.schema.dropTable('conversation').execute();
  await db.schema.dropTable('directMessage').execute();

  await db.schema.dropTable('game').execute();
  await db.schema.dropTable('privateGameRequest').execute();
  await db.schema.dropTable('publicGameRequest').execute();
}

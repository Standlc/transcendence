import { Module, Global } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { ChannelMessage } from '../types/schema';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useValue: new Kysely<ChannelMessage>({
        dialect: new PostgresDialect({
          pool: async () => {
            try {
              const pool = new Pool({
                host: process.env.PGHOST,
                database: process.env.PGDATABASE,
                user: process.env.PGUSER,
                password: process.env.PGPASSWORD,
              });
              console.log('Pool created successfully');
              return pool;
            } catch (error) {
              console.error('Error creating pool:', error);
              throw error;
            }
          },
        }),
      }),
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class KyselyModule {}

import { Injectable } from '@nestjs/common';
import { db } from './database';
import { sql } from 'kysely';

@Injectable()
export class AppService {
  async getHello(): Promise<any> {
    const { rows }: any = await sql`SELECT NOW()`.execute(db);
    return rows[0].now;
    // return 'Hello World!';
  }
}

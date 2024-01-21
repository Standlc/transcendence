import { Injectable } from '@nestjs/common';
import { db } from 'src/database';

@Injectable()
export class PublicGameRequestsService {
  async getFirst() {
    const requestMatch = await db
      .selectFrom('publicGameRequest')
      .where('userId', '=', 1)
      .selectAll()
      .executeTakeFirst();
    return requestMatch;
  }

  async delete(requestUserId: number) {
    await db
      .deleteFrom('publicGameRequest')
      .where('userId', '=', requestUserId)
      .execute();
  }

  async new(userId: number) {
    const request = await db
      .insertInto('publicGameRequest')
      .values({
        userId: userId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return request;
  }
}

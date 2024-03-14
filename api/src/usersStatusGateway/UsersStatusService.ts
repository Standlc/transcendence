import { Injectable } from '@nestjs/common';
import { db } from 'src/database';

@Injectable()
export class UsersStatusService {
  async isUserPlaying(userId: number) {
    const userGame = await db
      .selectFrom('game')
      .where((eb) =>
        eb.or([eb('playerOneId', '=', userId), eb('playerTwoId', '=', userId)]),
      )
      .where('winnerId', 'is', null)
      .select('game.id')
      .executeTakeFirst();
    return userGame != null;
  }
}

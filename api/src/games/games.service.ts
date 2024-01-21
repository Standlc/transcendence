import { Injectable } from '@nestjs/common';
import { db } from 'src/database';
import { Updateable } from 'kysely';
import { Game } from '../types/schema';
import { GameType, PlayerType } from 'src/types/game';

@Injectable()
export class GamesService {
  async new(game: {
    player1_id: number;
    player2_id: number;
    isPublic: boolean;
  }) {
    const createdGame = await db
      .insertInto('game')
      .values({
        player1_id: game.player1_id,
        player2_id: game.player2_id,
        player1_score: 0,
        player2_score: 0,
        isPublic: game.isPublic,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return createdGame;
  }

  async getFirstWithId(gameId: number) {
    const game = await db
      .selectFrom('game')
      .where('id', '=', gameId)
      .selectAll()
      .executeTakeFirstOrThrow();
    return game;
  }

  async finishGame(gameState: GameType) {
    const { playerLeft, playerRight, id } = gameState.game;
    const updatedGame = await this.updateGame(
      {
        winnerId: this.getWinnerId(gameState),
        player1_score: playerLeft.score,
        player2_score: playerRight.score,
      },
      id,
    );
    return updatedGame;
  }

  async updateGame(game: Updateable<Game>, gameId: number) {
    const updatedGame = await db
      .updateTable('game')
      .set(game)
      .where('game.id', '=', gameId)
      .returningAll()
      .execute();
    return updatedGame;
  }

  private getWinnerId(gameState: GameType) {
    const { playerLeft, playerRight } = gameState.game;

    if (gameState.userIdBeingDisconnected !== undefined) {
      return gameState.userIdBeingDisconnected;
    }

    if (playerLeft.score > playerRight.score) {
      return playerLeft.userId;
    }
    return playerRight.userId;
  }
}

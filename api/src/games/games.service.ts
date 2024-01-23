import { Injectable } from '@nestjs/common';
import { db } from 'src/database';
import { Insertable, Updateable } from 'kysely';
import { Game } from '../types/schema';
import { GameType, LiveGameDto, LiveGameType } from 'src/types/game';
import { AppGame } from 'src/types/games/games';

@Injectable()
export class GamesService {
  constructor() {}

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

  async finishGame(gameState: GameType): Promise<AppGame | undefined> {
    const { playerLeft, playerRight } = gameState.game;
    const updatedGame = await this.saveGame({
      winnerId: this.getWinnerId(gameState),
      player1_score: playerLeft.score,
      player2_score: playerRight.score,
      player1_id: gameState.game.playerLeft.id,
      player2_id: gameState.game.playerRight.id,
      isPublic: gameState.isPublic,
    });
    return updatedGame;
  }

  async saveGame(game: Insertable<Game>) {
    const updatedGame = await db
      .insertInto('game')
      .values(game)
      .returningAll()
      .executeTakeFirst();
    return updatedGame;
  }

  async completeGamesInfos(games: LiveGameType[]) {
    const gameIds = games.map((game) => game.players.map((p) => p.id)).flat();

    console.log('game ids', gameIds);
    const playersInfos = await this.getPlayersInfos(gameIds);
    console.log('player infos', playersInfos);

    return games.map((game) => {
      const gameWithInfo: LiveGameDto = {
        players: [],
        id: game.id,
      };

      game.players.forEach((player) => {
        const playerInfo = playersInfos.find((p) => p.id === player.id);
        if (playerInfo) {
          gameWithInfo['players'].push({
            ...playerInfo,
            score: player.score,
          });
        }
      });
      return gameWithInfo;
    });
  }

  async getPlayersInfos(playersIds: number[]) {
    if (!playersIds.length) {
      return [];
    }

    const playersInfos = await db
      .selectFrom('user')
      .where('id', 'in', playersIds)
      .select(['rating', 'id', 'avatarUrl', 'username'])
      .execute();

    return playersInfos;
  }

  private getWinnerId(gameState: GameType) {
    const { playerLeft, playerRight } = gameState.game;

    if (gameState.userIdBeingDisconnected !== undefined) {
      return gameState.userIdBeingDisconnected;
    }

    if (playerLeft.score > playerRight.score) {
      return playerLeft.id;
    }
    return playerRight.id;
  }
}

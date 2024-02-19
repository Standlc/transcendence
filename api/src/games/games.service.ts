import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from 'src/database';
import { ExpressionBuilder, Insertable, Selectable } from 'kysely';
import { DB, Game, PublicGameRequest } from '../types/schema';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { AppGame } from 'src/types/games/returnTypes';

@Injectable()
export class GamesService {
  constructor() {}

  async getOngoingPublicGames(limit?: number): Promise<AppGame[]> {
    const games: AppGame[] = await this.selectGame({ ongoing: true })
      .where('winnerId', 'is', null)
      .where('isPublic', 'is', true)
      .orderBy('game.createdAt desc')
      .$if(!!limit, (eb) => eb.limit(limit ?? 0))
      .execute();
    return games;
  }

  async getByGameId(gameId: number, userId: number): Promise<AppGame> {
    const game = await this.selectGame({
      gameId,
    }).executeTakeFirst();
    if (!game) {
      throw new NotFoundException();
    }

    const isUserAPlayer =
      game.playerOne?.id === userId || game.playerTwo?.id === userId;
    if (!game.isPublic && !isUserAPlayer) {
      throw new ForbiddenException();
    }

    return game;
  }

  private selectGame(props?: {
    gameId?: number;
    ongoing?: boolean;
    playerId?: number;
  }) {
    return db
      .selectFrom('game')
      .$if(!!props?.gameId, (eb) =>
        eb.where('game.id', '=', props?.gameId ?? 0),
      )
      .$if(!!props?.ongoing, (eb) =>
        eb.where('winnerId', 'is', null).where('isPublic', 'is', true),
      )
      .$if(!!props?.playerId, (eb) =>
        eb.where((eb) =>
          eb.or([
            eb('game.playerOneId', '=', props?.playerId ?? 0),
            eb('game.playerTwoId', '=', props?.playerId ?? 0),
          ]),
        ),
      )
      .select((eb) => [
        this.selectGamePlayer(eb, 1),
        this.selectGamePlayer(eb, 2),
      ])
      .select([
        'game.id',
        'game.points',
        'game.powerUps',
        'game.winnerId',
        'game.createdAt',
        'game.isPublic',
      ]);
  }

  private selectGamePlayer(eb: ExpressionBuilder<DB, 'game'>, which: 1 | 2) {
    return jsonObjectFrom(
      eb
        .selectFrom('user')
        .whereRef('user.id', '=', which === 1 ? 'playerOneId' : 'playerTwoId')
        .select([
          'rating',
          'id',
          'username',
          'user.avatarUrl',
          'game.points',
          which === 1 ? 'playerOneScore as score' : 'playerTwoScore as score',
        ]),
    ).as(which === 1 ? 'playerOne' : 'playerTwo');
  }

  async create(
    matchingGameRequest: Selectable<PublicGameRequest>,
    userId: number,
  ): Promise<Selectable<Game>> {
    const gameRecord = await this.new({
      isPublic: !matchingGameRequest.targetId,
      points: matchingGameRequest.points,
      powerUps: matchingGameRequest.powerUps,
      playerOneId: matchingGameRequest.userId,
      playerTwoId: userId,
    });
    return gameRecord;
  }

  async finishGame(gameId: number, winnerId: number) {
    await db
      .updateTable('game')
      .set({
        winnerId,
      })
      .where('game.id', '=', gameId)
      .execute();
  }

  async updatePlayerScore(
    gameId: number,
    which: 'playerOne' | 'playerTwo',
    score: number,
  ) {
    await db
      .updateTable('game')
      .where('game.id', '=', gameId)
      .set(
        which === 'playerOne'
          ? {
              playerOneScore: score,
            }
          : {
              playerTwoScore: score,
            },
      )
      .execute();
  }

  async new(game: Insertable<Game>) {
    const updatedGame = await db
      .insertInto('game')
      .values(game)
      .returningAll()
      .executeTakeFirstOrThrow();
    return updatedGame;
  }

  async findByUserId(props?: {
    userId?: number;
    ongoing?: boolean;
  }): Promise<AppGame | undefined> {
    const game = await this.selectGame({
      playerId: props?.userId,
      ongoing: props?.ongoing,
    }).executeTakeFirst();
    return game;
  }

  async delete(gameId: number) {
    await db.deleteFrom('game').where('id', '=', gameId).execute();
  }
}

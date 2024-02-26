import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { db } from 'src/database';
import { ExpressionBuilder, Insertable, Selectable } from 'kysely';
import { DB, Game, GameRequest } from '../types/schema';
import { jsonBuildObject, jsonObjectFrom } from 'kysely/helpers/postgres';
import { UserGame } from 'src/types/games';
import { PlayersRatingChangesType } from 'src/games/players/players.service';
import { PongGateway } from 'src/pong/Pong.gateway';

@Injectable()
export class GamesService {
  constructor(
    @Inject(forwardRef(() => PongGateway))
    private readonly gameServer: PongGateway,
  ) {}

  async getOngoingPublicGames(limit?: number): Promise<UserGame[]> {
    const games: UserGame[] = await this.selectGame({ ongoing: true })
      .where('winnerId', 'is', null)
      .where('isPublic', 'is', true)
      .orderBy('game.createdAt desc')
      .$if(!!limit, (eb) => eb.limit(limit ?? 0))
      .execute();
    return games;
  }

  async getByGameId(gameId: number, userId: number): Promise<UserGame> {
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
      .innerJoin('user as playerOne', 'playerOne.id', 'game.playerOneId')
      .select((eb) =>
        jsonBuildObject({
          id: eb.ref('playerOne.id'),
          score: eb.ref('game.playerOneScore'),
          rating: eb.ref('playerOne.rating'),
          username: eb.ref('playerOne.username'),
          avatarUrl: eb.ref('playerOne.avatarUrl'),
          ratingChange: eb.ref('game.playerOneRatingChange'),
        }).as('playerOne'),
      )
      .innerJoin('user as playerTwo', 'playerTwo.id', 'game.playerTwoId')
      .select((eb) =>
        jsonBuildObject({
          id: eb.ref('playerTwo.id'),
          score: eb.ref('game.playerTwoScore'),
          rating: eb.ref('playerTwo.rating'),
          username: eb.ref('playerTwo.username'),
          avatarUrl: eb.ref('playerTwo.avatarUrl'),
          ratingChange: eb.ref('game.playerTwoRatingChange'),
        }).as('playerTwo'),
      )
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
          which === 1
            ? 'playerOneRatingChange as ratingChange'
            : 'playerTwoRatingChange as ratingChange',
        ]),
    ).as(which === 1 ? 'playerOne' : 'playerTwo');
  }

  async finishGame(
    gameId: number,
    winnerId: number,
    playersRatingsChange?: PlayersRatingChangesType,
  ) {
    return await db
      .updateTable('game')
      .set({
        winnerId,
        playerOneRatingChange:
          playersRatingsChange?.playerOne.ratingChange ?? 0,
        playerTwoRatingChange:
          playersRatingsChange?.playerTwo.ratingChange ?? 0,
      })
      .where('game.id', '=', gameId)
      .returningAll()
      .executeTakeFirstOrThrow();
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

  async create(game: Insertable<Game>) {
    const newGame = await db
      .insertInto('game')
      .values(game)
      .returningAll()
      .executeTakeFirstOrThrow();
    return newGame;
  }

  async findByUserId(props?: {
    userId?: number;
    ongoing?: boolean;
  }): Promise<UserGame | undefined> {
    const game = await this.selectGame({
      playerId: props?.userId,
      ongoing: props?.ongoing,
    }).executeTakeFirst();
    return game;
  }

  async startNew(gameRequest: Selectable<GameRequest>, userId: number) {
    const gameRecord = await this.create({
      isPublic: gameRequest.targetId == null,
      points: gameRequest.points,
      powerUps: gameRequest.powerUps,
      playerOneId: gameRequest.userId,
      playerTwoId: userId,
    });
    this.gameServer.startGame(gameRecord);
  }

  async delete(gameId: number) {
    await db.deleteFrom('game').where('id', '=', gameId).execute();
  }
}

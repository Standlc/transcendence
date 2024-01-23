import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { db } from 'src/database';
import { GamesService } from 'src/games/games.service';
import { OnlineGateway } from 'src/onlineGateway/online.gateway';
import { PongGateway } from 'src/pong/pong.gateway';
import {
  GAME_REQUEST_STATUS,
  GameRequestDto,
  gameInviteResponseDto,
} from 'src/types/game';
import {
  AppGameRequest,
  GameRequestResponseDto,
} from 'src/types/games/gameRequests';

@Injectable()
export class GameRequestsService {
  constructor(
    @Inject(forwardRef(() => PongGateway))
    private readonly gameServer: PongGateway,
    private readonly onlineServer: OnlineGateway,
  ) {}

  async delete(userId: number) {
    await db
      .deleteFrom('publicGameRequest')
      .where('userId', '=', userId)
      .execute();
  }

  async handlePrivateRequest(req: GameRequestDto, userId: number) {
    if (!req.targetId) {
      return;
    }
    const isTargetUserOnline = this.onlineServer.isOnline(req.targetId);
    if (!isTargetUserOnline) {
      return {
        status: GAME_REQUEST_STATUS.TARGET_USER_NOT_CONNECTED,
      };
    }
    const targetUserCurrGame = this.gameServer.findUserGame(userId);
    if (targetUserCurrGame) {
      return {
        status: GAME_REQUEST_STATUS.TARGET_USER_ALREADY_IN_GAME,
      };
    }
    const gameInvite = await this.create(req, userId);
    this.gameServer.sendPrivateGameInvite(gameInvite);
  }

  findUserCurrentGame(userId: number): GameRequestResponseDto | undefined {
    const currentGame = this.gameServer.findUserGame(userId);
    if (currentGame) {
      return {
        currentGame: { id: currentGame.game.id },
        status: GAME_REQUEST_STATUS.USER_ALREADY_IN_GAME,
      };
    }
  }

  async handleFindMatch(gameReq: GameRequestDto, userId: number) {
    const match = await this.findMatch(gameReq, userId);
    if (match) {
      // console.log('STARTING GAME!');
      this.gameServer.startGame(gameReq, [match.userId, userId]);
      this.delete(match.userId);
      return;
    }
    await this.create(gameReq, userId);
  }

  async findMatch(req: GameRequestDto, userId: number) {
    const match = await db
      .selectFrom('publicGameRequest')
      .where('points', '=', req.nbPoints)
      .where('userId', '!=', userId)
      .where('powerUps', 'is', req.powerUps)
      .where('targetId', 'is', null)
      .selectAll()
      .executeTakeFirst();
    // console.log(req);
    // console.log(match);
    return match;
  }

  async create(req: GameRequestDto, userId: number): Promise<AppGameRequest> {
    const request = await db
      .insertInto('publicGameRequest')
      .values({
        userId: userId,
        points: req.nbPoints,
        powerUps: req.powerUps,
        targetId: req.targetId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return request;
  }

  async findByUserId(userId: number): Promise<AppGameRequest> {
    return await db
      .selectFrom('publicGameRequest')
      .where('userId', '=', userId)
      .selectAll()
      .executeTakeFirstOrThrow();
  }

  async respondToInvite(
    inviteResponse: gameInviteResponseDto,
    ogInvite: AppGameRequest,
    userId: number,
  ) {
    await this.delete(inviteResponse.fromId);
    if (inviteResponse.isAccepted) {
      this.gameServer.startGame(
        {
          nbPoints: ogInvite.points,
          powerUps: ogInvite.powerUps,
        },
        [inviteResponse.fromId, userId],
      );
    }
  }
}

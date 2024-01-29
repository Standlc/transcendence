import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Insertable, Selectable } from 'kysely';
import { db } from 'src/database';
import { GamesService } from 'src/games/games.service';
import { PongGateway } from 'src/pong/pong.gateway';
import { GameInviteResponseType } from 'src/types/games/apiInputTypes';
import {
  PrivateGameRequestDto,
  PublicGameRequestDto,
} from 'src/types/games/gameRequestsDto';
import { PublicGameRequest } from 'src/types/schema';

@Injectable()
export class GameRequestsService {
  constructor(
    @Inject(forwardRef(() => PongGateway))
    private readonly gameServer: PongGateway,
    private readonly games: GamesService,
  ) {}

  async delete(userId: number) {
    await db
      .deleteFrom('publicGameRequest')
      .where('userId', '=', userId)
      .execute();
  }

  async handlePrivateRequest(req: PrivateGameRequestDto, userId: number) {
    const gameInvite = await this.create({ ...req, userId }, userId);
    this.gameServer.sendPrivateGameInvite(gameInvite);
  }

  async handleFindMatch(gameReq: PublicGameRequestDto, userId: number) {
    const match = await this.findMatch(gameReq, userId);
    if (match) {
      await this.delete(match.userId);
      const gameRecord = await this.games.create(match, userId);
      this.gameServer.startGame(gameRecord);
    } else {
      await this.create({ ...gameReq, userId }, userId);
    }
  }

  async findMatch(
    req: PublicGameRequestDto,
    userId: number,
  ): Promise<Selectable<PublicGameRequest> | undefined> {
    const match = await db
      .selectFrom('publicGameRequest')
      .where('points', '=', req.points)
      .where('userId', '!=', userId)
      .where('powerUps', 'is', req.powerUps)
      .where('targetId', 'is', null)
      .selectAll()
      .executeTakeFirst();
    return match;
  }

  async create(
    req: Insertable<PublicGameRequest>,
    userId: number,
  ): Promise<Selectable<PublicGameRequest>> {
    const request = await db
      .insertInto('publicGameRequest')
      .values({
        userId: userId,
        points: req.points,
        powerUps: req.powerUps,
        targetId: req.targetId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return request;
  }

  async findByUserId(userId: number): Promise<Selectable<PublicGameRequest>> {
    return await db
      .selectFrom('publicGameRequest')
      .where('userId', '=', userId)
      .selectAll()
      .executeTakeFirstOrThrow();
  }

  async respondToInvite(
    inviteResponse: GameInviteResponseType,
    ogInvite: Selectable<PublicGameRequest>,
    userInvitedId: number,
  ) {
    await this.delete(inviteResponse.fromUserId);
    if (inviteResponse.isAccepted) {
      const gameRecord = await this.games.create(ogInvite, userInvitedId);
      this.gameServer.startGame(gameRecord);
    }
  }
}

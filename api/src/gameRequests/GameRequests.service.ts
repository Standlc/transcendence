import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ExpressionBuilder, Selectable } from 'kysely';
import { jsonBuildObject, jsonObjectFrom } from 'kysely/helpers/postgres';
import { db } from 'src/database';
import { GamesService } from 'src/games/games.service';
import { PongGateway } from 'src/pong/Pong.gateway';
import {
  PrivateGameRequestDto,
  PublicGameRequestDto,
  UserGameInvitation,
  UserGameRequest,
} from 'src/types/gameRequests';
import { DB, GameRequest } from 'src/types/schema';

@Injectable()
export class GameRequestsService {
  constructor(
    @Inject(forwardRef(() => PongGateway))
    private readonly gameServer: PongGateway,
    private readonly gamesService: GamesService,
  ) {}

  async sendGameInvitation(req: PrivateGameRequestDto, userId: number) {
    const gameInvitation = await this.createInvitation({ ...req, userId });
    if (gameInvitation.targetUser != null) {
      this.gameServer.sendGameInvitation({
        ...gameInvitation,
        targetUser: gameInvitation.targetUser,
      });
    }
    return gameInvitation;
  }

  async handleFindMatch(
    gameReq: PublicGameRequestDto,
    userId: number,
  ): Promise<UserGameRequest | undefined> {
    const match = await this.findMatch(gameReq, userId);
    if (match) {
      await this.delete(match.userId);
      await this.gamesService.startNew(match, userId);
    } else {
      return await this.createPublicRequest({ ...gameReq, userId });
    }
  }

  async findMatch(
    req: PublicGameRequestDto,
    userId: number,
  ): Promise<Selectable<GameRequest> | undefined> {
    const match = await db
      .selectFrom('gameRequest')
      .where('points', '=', req.points)
      .where('userId', '!=', userId)
      .where('powerUps', 'is', req.powerUps)
      .where('targetId', 'is', null)
      .leftJoin('blockedUser', (join) =>
        join.on((eb) =>
          eb.or([
            eb.and([
              eb('blockedById', '=', userId),
              eb('blockedId', '=', eb.ref('gameRequest.userId')),
            ]),
            eb.and([
              eb('blockedById', '=', eb.ref('gameRequest.userId')),
              eb('blockedId', '=', userId),
            ]),
          ]),
        ),
      )
      .where('blockedId', 'is', null)
      .selectAll('gameRequest')
      .executeTakeFirst();
    return match;
  }

  async createPublicRequest(req: PublicGameRequestDto & { userId: number }) {
    const request = await db
      .insertInto('gameRequest')
      .values({
        powerUps: req.powerUps,
        points: req.points,
        userId: req.userId,
      })
      .returning(['createdAt', 'points', 'powerUps', 'userId'])
      .executeTakeFirstOrThrow();
    return request;
  }

  async createInvitation(
    req: PrivateGameRequestDto & { userId: number },
  ): Promise<UserGameInvitation> {
    const request = await db
      .insertInto('gameRequest')
      .values({
        powerUps: req.powerUps,
        points: req.points,
        userId: req.userId,
        targetId: req.targetId,
      })
      .returning(['createdAt', 'points', 'powerUps', 'userId'])
      .returning((eb) =>
        this.selectUser(eb, req.targetId ?? 0).as('targetUser'),
      )
      .returning((eb) => this.selectUser(eb, req.userId ?? 0).as('inviterUser'))
      .executeTakeFirstOrThrow();
    if (!request.targetUser || !request.inviterUser) {
      throw new InternalServerErrorException();
    }
    return request as UserGameInvitation;
  }

  async findByUserId(
    userId: number,
  ): Promise<Selectable<GameRequest> | undefined> {
    return await db
      .selectFrom('gameRequest')
      .where('userId', '=', userId)
      .selectAll()
      .executeTakeFirst();
  }

  async acceptGameInvitation(inviterId: number, userId: number) {
    const invitation = await this.findByUserId(inviterId);
    if (!invitation) {
      throw new NotFoundException();
    }
    await this.delete(inviterId);
    await this.gamesService.startNew(invitation, userId);
  }

  async declineGameInvite(inviterId: number, userId: number) {
    const invitation = await this.findGameInvitation({
      inviterId,
      targetId: userId,
    });
    if (!invitation) {
      throw new NotFoundException();
    }
    await this.delete(inviterId);
    this.gameServer.sendGameInvitationRefused(inviterId);
  }

  async getUserCurrentGameRequest(userId: number) {
    return await db
      .selectFrom('gameRequest')
      .where('userId', '=', userId)
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('user')
            .whereRef('user.id', '=', 'targetId')
            .select(['user.id', 'user.username', 'user.rating', 'avatarUrl']),
        ).as('targetUser'),
      )
      .select(['points', 'powerUps', 'createdAt'])
      .executeTakeFirst();
  }

  async getUserGameInvitations(userId: number): Promise<UserGameInvitation[]> {
    return await db
      .selectFrom('gameRequest')
      .where('targetId', '=', userId)
      .innerJoin('user as targetUser', 'targetUser.id', 'targetId')
      .select((eb) =>
        jsonBuildObject({
          id: eb.ref('targetUser.id'),
          username: eb.ref('targetUser.username'),
          avatarUrl: eb.ref('targetUser.avatarUrl'),
          rating: eb.ref('targetUser.rating'),
        }).as('targetUser'),
      )
      .innerJoin('user as inviterUser', 'inviterUser.id', 'userId')
      .select((eb) =>
        jsonBuildObject({
          id: eb.ref('inviterUser.id'),
          username: eb.ref('inviterUser.username'),
          avatarUrl: eb.ref('inviterUser.avatarUrl'),
          rating: eb.ref('inviterUser.rating'),
        }).as('inviterUser'),
      )
      .select(['points', 'gameRequest.createdAt', 'gameRequest.powerUps'])
      .execute();
  }

  async handleDeleteRequest(userId: number) {
    const gameRequest = await this.findByUserId(userId);
    if (!gameRequest) {
      throw new NotFoundException();
    }

    if (!!gameRequest.targetId) {
      this.gameServer.sendGameInvitationCanceled({
        targetId: gameRequest.targetId,
        inviterId: userId,
      });
    }
    await this.delete(userId);
  }

  async delete(userId: number) {
    await db.deleteFrom('gameRequest').where('userId', '=', userId).execute();
  }

  private selectUser(eb: ExpressionBuilder<DB, 'gameRequest'>, userId: number) {
    return jsonObjectFrom(
      eb
        .selectFrom('user')
        .where('user.id', '=', userId)
        .select(['user.id', 'username', 'avatarUrl', 'rating']),
    );
  }

  private async findGameInvitation({
    inviterId,
    targetId,
  }: {
    inviterId: number;
    targetId: number;
  }) {
    return db
      .selectFrom('gameRequest')
      .where('userId', '=', inviterId)
      .where('targetId', '=', targetId)
      .select(['userId', 'targetId'])
      .executeTakeFirst();
  }

  verifyGamePointsOrThrow(points: number) {
    if (points !== 42 && points !== 21 && points !== 10) {
      throw new BadRequestException();
    }
  }
}

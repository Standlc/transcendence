import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GameRequestsService } from './GameRequests.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  UserGameRequest,
  PrivateGameRequestDto,
  PublicGameRequestDto,
  GameInvitationUser,
  UserGameInvitation,
} from 'src/types/gameRequests';
import { FriendsService } from 'src/friends/friends.service';

@UseGuards(JwtAuthGuard)
@Controller('game-requests')
export class GameRequestsController {
  constructor(
    private readonly gameRequests: GameRequestsService,
    private readonly friendsService: FriendsService,
  ) {}

  @Post('/')
  async findGameMatch(
    @Body() body: PublicGameRequestDto,
    @Request() req: Request & { user: { id: number } },
  ): Promise<UserGameRequest | undefined> {
    this.gameRequests.verifyGamePointsOrThrow(body.points);
    const userId: number = req.user.id;
    await this.gameRequests.delete(userId);
    return await this.gameRequests.handleFindMatch(body, userId);
  }

  @Post('/invitation')
  async handleGameInvitation(
    @Body() body: PrivateGameRequestDto,
    @Request() req: Request & { user: { id: number } },
  ): Promise<UserGameInvitation> {
    this.gameRequests.verifyGamePointsOrThrow(body.points);

    const userId: number = req.user.id;
    if (userId === body.targetId) {
      throw new BadRequestException();
    }

    await this.gameRequests.delete(userId);

    const areUsersFriends = await this.friendsService.isFriend(
      userId,
      body.targetId,
    );
    if (!areUsersFriends) {
      throw new ForbiddenException();
    }

    return await this.gameRequests.sendGameInvitation(body, userId);
  }

  @Post('/accept/:inviterId')
  async acceptGameInvitation(
    @Param('inviterId') inviterId: number,
    @Request() req,
  ) {
    const userId: number = req.user.id;
    await this.gameRequests.acceptGameInvitation(inviterId, userId);
  }

  @Delete('/decline/:inviterId')
  async declineGameInvite(
    @Param('inviterId') inviterId: number,
    @Request() req,
  ) {
    const userId: number = req.user.id;
    await this.gameRequests.declineGameInvite(inviterId, userId);
  }

  @Get('')
  async getGameRequest(
    @Request() req,
  ): Promise<
    (UserGameRequest & { targetUser: GameInvitationUser | null }) | null
  > {
    const userId: number = req.user.id;
    const gameRequest =
      await this.gameRequests.getUserCurrentGameRequest(userId);
    if (!gameRequest) {
      return null;
    }
    return gameRequest;
  }

  @Get('/invitations')
  async getUserGameInvitations(@Request() req): Promise<UserGameInvitation[]> {
    const userId: number = req.user.id;
    const gameInvitations =
      await this.gameRequests.getUserGameInvitations(userId);
    return gameInvitations;
  }

  @Delete('/')
  async deleteGameRequest(@Request() req) {
    const userId: number = req.user.id;
    await this.gameRequests.handleDeleteRequest(userId);
  }
}

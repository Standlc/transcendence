import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
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
import { ZodValidationPipe } from 'src/ZodValidatePipe';
import {
  ZodPrivateGameRequestDto,
  ZodPublicGameRequestDto,
} from 'src/types/zodGameRequestsSchema';

@UseGuards(JwtAuthGuard)
@Controller('game-requests')
export class GameRequestsController {
  constructor(
    private readonly gameRequests: GameRequestsService,
    private readonly friendsService: FriendsService,
  ) {}

  @Post('/')
  async findGameMatch(
    @Body(new ZodValidationPipe(ZodPublicGameRequestDto))
    body: PublicGameRequestDto,
    @Request() req,
  ): Promise<UserGameRequest | undefined> {
    this.gameRequests.verifyGamePointsOrThrow(body.points);
    const userId: number = req.user.id;
    await this.gameRequests.delete(userId);
    return await this.gameRequests.handleFindMatch(body, userId);
  }

  @Post('/invitation')
  async handleGameInvitation(
    @Body(new ZodValidationPipe(ZodPrivateGameRequestDto))
    body: PrivateGameRequestDto,
    @Request() req,
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
    @Param('inviterId', new ParseIntPipe()) inviterId: number,
    @Request() req,
  ) {
    const userId: number = req.user.id;
    await this.gameRequests.acceptGameInvitation(inviterId, userId);
  }

  @Delete('/decline/:inviterId')
  async declineGameInvite(
    @Param('inviterId', new ParseIntPipe()) inviterId: number,
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

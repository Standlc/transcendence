import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GameRequestsService } from './GameRequests.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GameRequestDto, gameInviteResponseDto } from 'src/types/game';
import { UsersService } from 'src/users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('game-requests')
export class GameRequestsController {
  constructor(
    private readonly gameRequestsService: GameRequestsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('/')
  async findGameMatch(
    @Body() body: GameRequestDto,
    @Request() req: Request & { user: { id: number } },
  ): Promise<any | undefined> {
    const userId: number = req.user.id;
    await this.gameRequestsService.delete(userId);
    const res = this.gameRequestsService.findUserCurrentGame(userId);
    if (res) {
      return res;
    }

    if (body.targetId) {
      const targetUser = await this.usersService.getUserById(body.targetId);
      // -> check users are friends
      if (!targetUser) throw new NotFoundException();
      return await this.gameRequestsService.handlePrivateRequest(body, userId);
    }
    await this.gameRequestsService.handleFindMatch(body, userId);
  }

  @Post('/accept-game-invite')
  async acceptGameInvite(@Body() body: gameInviteResponseDto, @Request() req) {
    const userId: number = req.user.id;
    const gameInvite = await this.gameRequestsService.findByUserId(userId);
    this.gameRequestsService.respondToInvite(body, gameInvite, userId);
  }

  @Delete('/')
  async deleteGameRequest(@Request() req) {
    const userId: number = req.user.id;
    await this.gameRequestsService.delete(userId);
  }
}

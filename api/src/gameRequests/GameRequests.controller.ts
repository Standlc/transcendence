import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GameRequestsService } from './GameRequests.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { GameInviteResponseType } from 'src/types/games/apiInputTypes';
import {
  AppGameRequest,
  PrivateGameRequestDto,
  PublicGameRequestDto,
} from 'src/types/games/gameRequestsDto';

@UseGuards(JwtAuthGuard)
@Controller('game-requests')
export class GameRequestsController {
  constructor(
    private readonly gameRequests: GameRequestsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('/')
  async findGameMatch(
    @Body() body: PublicGameRequestDto,
    @Request() req: Request & { user: { id: number } },
  ) {
    if (body.points > 42 || body.points < 10) {
      throw new BadRequestException();
    }
    const userId: number = req.user.id;
    await this.gameRequests.delete(userId);
    await this.gameRequests.handleFindMatch(body, userId);
  }

  @Post('/private')
  async privateGameRequest(
    @Body() body: PrivateGameRequestDto,
    @Request() req: Request & { user: { id: number } },
  ) {
    const userId: number = req.user.id;
    await this.gameRequests.delete(userId);

    const targetUser = await this.usersService.getUserById(body.targetId);
    // -> check users are friends
    if (!targetUser) throw new NotFoundException();
    return await this.gameRequests.handlePrivateRequest(body, userId);
  }

  @Post('/accept')
  async acceptGameInvite(@Body() body: GameInviteResponseType, @Request() req) {
    const userId: number = req.user.id;
    try {
      const gameInvite = await this.gameRequests.findByUserId(userId);
      this.gameRequests.respondToInvite(body, gameInvite, userId);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @Get('')
  async getGameRequest(@Request() req): Promise<AppGameRequest | undefined> {
    const userId: number = req.user.id;
    const gameRequest = await this.gameRequests.getUserCurrentGameRequest(
      userId,
      true,
    );
    return gameRequest;
  }

  @Delete('/')
  async deleteGameRequest(@Request() req) {
    const userId: number = req.user.id;
    await this.gameRequests.delete(userId);
  }
}

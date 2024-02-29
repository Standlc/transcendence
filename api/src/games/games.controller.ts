import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserGame } from 'src/types/games';

export class GameIdDto {
  gameId: number;
}

@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get('/live')
  async getAllPublicGames(): Promise<UserGame[]> {
    const games = this.games.getOngoingPublicGames();
    return games;
  }

  @Get('/:gameId')
  async getGameInfo(
    @Param() params: GameIdDto,
    @Request() req,
  ): Promise<UserGame> {
    const userId: number = req.user.id;
    const game = await this.games.getByGameId(params.gameId, userId);
    return game;
  }
}

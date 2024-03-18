import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserGame } from 'src/types/games';

@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get('/live')
  async getAllPublicGames(): Promise<UserGame[]> {
    const games = this.games.getOngoingPublicGames();
    return games;
  }

  @Get('/current')
  async getUserCurrentGame(@Request() req): Promise<UserGame | null> {
    const userId: number = req.user.id;
    const currentGame = await this.games.getUserCurrentGame(userId);
    return currentGame ?? null;
  }

  @Get('/:gameId')
  async getGameInfo(
    @Param('gameId', new ParseIntPipe()) gameId: number,
    @Request() req,
  ): Promise<UserGame> {
    const userId: number = req.user.id;
    const game = await this.games.getByGameId(Number(gameId), userId);
    return game;
  }

  @Get('/history/:userId')
  async getUserGames(
    @Param('userId', new ParseIntPipe()) userId: number,
  ): Promise<UserGame[]> {
    const games = await this.games.getUserGameHistory(userId);
    return games;
  }
}

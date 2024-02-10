import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LeaderbordPlayer } from 'src/types/games/games';

@UseGuards(JwtAuthGuard)
@Controller('players')
export class PlayersController {
  constructor(private players: PlayersService) {}

  @Get('/leaderboard')
  async getLeaderboard(
    @Query('limit') limit: number,
  ): Promise<LeaderbordPlayer[]> {
    try {
      const leaderboard = await this.players.getLeaderboard(limit);
      return leaderboard;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  @Post('leaderboard')
  async getLeaderboardPlayer(
    @Body() body: number[],
  ): Promise<LeaderbordPlayer[]> {
    try {
      if (body.length === 0) {
        throw new BadRequestException();
      }
      const playerInfo = await this.players.getLeaderboardInfo(body);
      return playerInfo;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}

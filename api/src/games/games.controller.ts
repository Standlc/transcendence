import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { db } from 'src/database';

@Controller('games')
export class GamesController {
  constructor(private readonly gameService: GamesService) {}

  @Get('/public')
  getUserPublicGames() {
    //
  }

  //   @Put('')
  //   async handleScoresAndWinner(
  //     @Param() gameId: number,
  //     @Body() body: { player1_score: number; player2_score: number },
  //   ) {
  //     if (body.player1_score < 0 || body.player2_score < 0) {
  //       throw new HttpException(
  //         'Scores cannot be negative',
  //         HttpStatus.BAD_REQUEST,
  //       );
  //     }

  //     const game = await this.gameService.getFirstWithId(gameId);

  //     if (game.winnerId || game.player1_score || game.player2_score) {
  //       throw new HttpException(
  //         'Game cannot be updated as it is already completed',
  //         HttpStatus.FORBIDDEN,
  //       );
  //     }

  //     const updatedGame = this.gameService.finishGame(
  //       game,
  //       body.player1_score,
  //       body.player2_score,
  //     );
  //     return updatedGame;
  //   }

  //   @Post()
  //   handleNewGame(@Body body: ) {
  //     this.gameService.new()
  //   }
}

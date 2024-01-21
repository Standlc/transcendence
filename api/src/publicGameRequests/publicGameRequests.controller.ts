import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { PublicGameRequestsService } from './publicGameRequests.service';
import { GamesService } from 'src/games/games.service';

type PublicGameRequestBodyType = {
  userId: number;
};

@Controller()
export class PublicGameRequests {
  constructor(
    private readonly publicGameRequestService: PublicGameRequestsService,
    private readonly gameService: GamesService,
  ) {}

  @Get('/get-match')
  async handleGetMatch(@Body() body: PublicGameRequestBodyType) {
    const requestMatch = await this.publicGameRequestService.getFirst();

    // if (requestMatch) {
    //   await this.gameService.new({
    //     player1_id: requestMatch.userId,
    //     player2_id: body.userId,
    //   });
    // } else {
    //   return undefined;
    // }
  }

  @Post()
  async handleCreateRequest(@Body() body: PublicGameRequestBodyType) {
    await this.publicGameRequestService.new(body.userId);
  }

  @Delete()
  async handleDeleteRequest(@Body() body: PublicGameRequestBodyType) {
    await this.publicGameRequestService.delete(body.userId);
    return 'Public request deleted';
  }
}

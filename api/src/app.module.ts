import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PongGateway } from './pong/pong.gateway';
import { GamesController } from './games/games.controller';
import { GamesService } from './games/games.service';
import { PublicGameRequests } from './publicGameRequests/publicGameRequests.controller';
import { PublicGameRequestsService } from './publicGameRequests/publicGameRequests.service';
import { GameEngineService } from './pong/gameLogic/game';

@Module({
  imports: [UsersModule],
  controllers: [AppController, GamesController, PublicGameRequests],
  providers: [
    AppService,
    PongGateway,
    GamesService,
    PublicGameRequestsService,
    GameEngineService,
  ],
})
export class AppModule {}

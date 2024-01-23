import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { GameEngineService } from './pong/gameLogic/game';
import { AuthModule } from './auth/auth.module';
import { GameRequestsModule } from './gameRequests/GameRequests.module';
import { OnlineGateway } from './onlineGateway/online.gateway';
import { PongGameModule } from './pong/Pong.module';
import { GamesModule } from './games/Games.module';

@Module({
  imports: [UsersModule, AuthModule, GamesModule, GameRequestsModule, PongGameModule],
  controllers: [AppController],
  providers: [AppService, GameEngineService, OnlineGateway],
})
export class AppModule {}

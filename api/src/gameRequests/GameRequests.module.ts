import { Module } from '@nestjs/common';
import { GameRequestsController } from './GameRequests.controller';
import { GameRequestsService } from './GameRequests.service';
import { GamesService } from 'src/games/games.service';
import { PongGateway } from 'src/pong/pong.gateway';
import { PongGameModule } from 'src/pong/Pong.module';
import { GamesModule } from 'src/games/Games.module';
import { OnlineGateway } from 'src/onlineGateway/online.gateway';
import { GameEngineService } from 'src/pong/gameLogic/game';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@Module({
  imports: [GamesModule, PongGameModule],
  controllers: [GameRequestsController],
  providers: [
    GameRequestsService,
    OnlineGateway,
    GameEngineService,
    PongGateway,
    UsersService,
    JwtAuthGuard,
    JwtService,
    WsAuthGuard,
  ],
  exports: [GameRequestsService],
})
export class GameRequestsModule {}

import { Module } from '@nestjs/common';
import { GameRequestsController } from './GameRequests.controller';
import { GameRequestsService } from './GameRequests.service';
import { PongGameModule } from 'src/pong/Pong.module';
import { GamesModule } from 'src/games/Games.module';
import { OnlineGateway } from 'src/onlineGateway/online.gateway';
import { UsersService } from 'src/users/users.service';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@Module({
  imports: [GamesModule, PongGameModule],
  controllers: [GameRequestsController],
  providers: [GameRequestsService, OnlineGateway, UsersService, WsAuthGuard],
  exports: [GameRequestsService],
})
export class GameRequestsModule {}

import { Module } from '@nestjs/common';
import { GameRequestsController } from './GameRequests.controller';
import { GameRequestsService } from './GameRequests.service';
import { PongGameModule } from 'src/pong/Pong.module';
import { GamesModule } from 'src/games/Games.module';
import { UsersService } from 'src/users/users.service';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';

@Module({
  imports: [GamesModule, PongGameModule, UsersStatusModule],
  controllers: [GameRequestsController],
  providers: [GameRequestsService, UsersService, WsAuthGuard],
  exports: [GameRequestsService],
})
export class GameRequestsModule {}

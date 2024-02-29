import { Module, forwardRef } from '@nestjs/common';
import { GameRequestsController } from './GameRequests.controller';
import { GameRequestsService } from './GameRequests.service';
import { PongGameModule } from 'src/pong/Pong.module';
import { GamesModule } from 'src/games/Games.module';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';
import { FriendsModule } from 'src/friends/friends.module';

@Module({
  imports: [GamesModule, forwardRef(() => PongGameModule), FriendsModule, UsersStatusModule],
  controllers: [GameRequestsController],
  providers: [GameRequestsService, WsAuthGuard],
  exports: [GameRequestsService],
})
export class GameRequestsModule {}

import { Module, forwardRef } from '@nestjs/common';
import { GameRequestsService } from 'src/gameRequests/GameRequests.service';
// import { GameEngineService } from './gameLogic/game';
import { PongGateway } from './pong.gateway';
import { GamesModule } from 'src/games/Games.module';
import { OnlineGateway } from 'src/onlineGateway/online.gateway';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { UsersModule } from 'src/users/users.module';
import { PlayersService } from './players/players.service';

@Module({
  imports: [forwardRef(() => GamesModule), AuthModule, UsersModule],
  providers: [
    // GameEngineService,
    PongGateway,
    GameRequestsService,
    OnlineGateway,
    JwtService,
    WsAuthGuard,
    PlayersService,
  ],
  exports: [PongGateway],
})
export class PongGameModule {}

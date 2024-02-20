import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameRequestsModule } from './gameRequests/GameRequests.module';
import { UsersStatusModule } from './usersStatusGateway/UsersStatus.module';
import { PongGameModule } from './pong/Pong.module';
import { GamesModule } from './games/Games.module';
import { PlayersModule } from './pong/players/players.module';
import { FriendsService } from './friends/friends.service';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    GamesModule,
    GameRequestsModule,
    PongGameModule,
    PlayersModule,
    FriendsModule,
    UsersStatusModule,
  ],
  controllers: [AppController],
  providers: [AppService, FriendsService],
})
export class AppModule {}

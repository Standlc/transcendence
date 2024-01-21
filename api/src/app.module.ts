import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PongGateway } from './pong/pong.gateway';
import { AuthModule } from './auth/auth.module';
import { FriendsService } from './friends/friends.service';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [UsersModule, AuthModule, FriendsModule],
  controllers: [AppController],
  providers: [AppService, PongGateway, FriendsService],
})
export class AppModule {}

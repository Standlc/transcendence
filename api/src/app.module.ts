import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PongGateway } from './pong/pong.gateway';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [UsersModule, AuthModule, ChatModule],
  controllers: [AppController],
  providers: [AppService, PongGateway],
})
export class AppModule {}

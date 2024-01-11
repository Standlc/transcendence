import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PongGateway } from './pong/pong.gateway';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService, PongGateway],
})
export class AppModule {}

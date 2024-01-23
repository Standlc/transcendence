import { Module } from '@nestjs/common';
import { KyselyModule } from './kysely.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { UserController } from './chat.controller';

@Module({
  imports: [KyselyModule],
  controllers: [UserController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}

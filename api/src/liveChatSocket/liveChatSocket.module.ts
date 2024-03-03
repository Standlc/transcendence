// live-chat.module.ts
import { Module } from '@nestjs/common';
import { LiveChatSocket } from './liveChatSocket.gateway';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@Module({
  providers: [LiveChatSocket, WsAuthGuard],
})
export class LiveChatModule {}

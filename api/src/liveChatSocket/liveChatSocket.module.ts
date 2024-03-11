// live-chat.module.ts
import { Module } from '@nestjs/common';
import { LiveChatSocket } from './liveChatSocket.gateway';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { ConnectedUsersService } from 'src/connectedUsers/connectedUsers.service';

@Module({
  providers: [LiveChatSocket, WsAuthGuard, ConnectedUsersService],
})
export class LiveChatModule {}

import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmGateway } from './dm.gateway';
import { DmController } from './dm.controller';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { FriendsService } from 'src/friends/friends.service';
import { ConnectedUsersService } from 'src/connectedUsers/connectedUsers.service';
import { FriendsModule } from 'src/friends/friends.module';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';
import { LiveChatSocket } from 'src/liveChatSocket/liveChatSocket.gateway';

@Module({
  imports: [FriendsModule, UsersStatusModule],
  controllers: [DmController],
  providers: [
    DmGateway,
    DmService,
    WsAuthGuard,
    FriendsService,
    ConnectedUsersService,
    LiveChatSocket,
  ],
})
export class DmModule {}

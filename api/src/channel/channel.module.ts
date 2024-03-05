import { Module } from '@nestjs/common';
import { ChannelGateway } from './channel.gateway';
import { ChannelService } from './channel.service';
import { UserController } from './channel.controller';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { ConnectedUsersService } from 'src/connectedUsers/connectedUsers.service';
import { FriendsService } from 'src/friends/friends.service';
import { Utils } from './utilsChannel.service';
import { SocketService } from './socketService.service';
import { FriendsModule } from 'src/friends/friends.module';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';
import { ChannelsController } from './Channels.controller';
import { ChannelsService } from './Channels.service';

@Module({
  imports: [FriendsModule, UsersStatusModule],
  controllers: [UserController, ChannelsController],
  providers: [
    ChannelGateway,
    ChannelService,
    WsAuthGuard,
    ConnectedUsersService,
    FriendsService,
    Utils,
    SocketService,
    ChannelsService,
  ],
})
export class ChannelModule {}

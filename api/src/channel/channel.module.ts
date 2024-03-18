import { Module, forwardRef } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { UserController } from './channel.controller';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { Utils } from './utilsChannel.service';
import { SocketService } from './socketService.service';
import { FriendsModule } from 'src/friends/friends.module';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';
import { BlockedUserModule } from 'src/blocked-user/blocked-user.module';
import { ChannelServerModule } from './ChannelServer.module';

@Module({
  imports: [
    FriendsModule,
    UsersStatusModule,
    BlockedUserModule,
    FriendsModule,
    forwardRef(() => ChannelServerModule),
  ],
  controllers: [UserController],
  providers: [ChannelService, WsAuthGuard, Utils, SocketService],
  exports: [ChannelService, Utils, SocketService],
})
export class ChannelModule {}

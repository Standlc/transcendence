import { Module } from '@nestjs/common';
import { ChannelGateway } from './channel.gateway';
import { ChannelService } from './channel.service';
import { UserController } from './channel.controller';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { ConnectedUsersService } from './connectedUsers/connectedUsers.service';

@Module({
  controllers: [UserController],
  providers: [
    ChannelGateway,
    ChannelService,
    WsAuthGuard,
    ConnectedUsersService,
  ],
})
export class ChannelModule {}

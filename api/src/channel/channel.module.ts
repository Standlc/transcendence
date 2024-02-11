import { Module } from '@nestjs/common';
import { ChannelGateway } from './channel.gateway';
import { ChannelService } from './channel.service';
import { UserController } from './channel.controller';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@Module({
  controllers: [UserController],
  providers: [ChannelGateway, ChannelService, WsAuthGuard],
})
export class ChannelModule {}

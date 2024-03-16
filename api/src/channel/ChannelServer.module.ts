import { Module, forwardRef } from '@nestjs/common';
import { ChannelGateway } from './channel.gateway';
import { ChannelModule } from './channel.module';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@Module({
  imports: [forwardRef(() => ChannelModule)],
  providers: [ChannelGateway, WsAuthGuard],
  exports: [ChannelGateway],
})
export class ChannelServerModule {}

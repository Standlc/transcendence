import { Module } from '@nestjs/common';
import { UsersStatusGateway } from './UsersStatus.gateway';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@Module({
  providers: [UsersStatusGateway, WsAuthGuard],
  exports: [UsersStatusGateway],
})
export class UsersStatusModule {}

import { Module } from '@nestjs/common';
import { UsersStatusGateway } from './UsersStatus.gateway';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { UsersStatusService } from './UsersStatusService';

@Module({
  imports: [],
  providers: [UsersStatusService, UsersStatusGateway, WsAuthGuard],
  exports: [UsersStatusGateway, UsersStatusService],
})
export class UsersStatusModule {}

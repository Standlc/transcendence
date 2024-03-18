import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmGateway } from './dm.gateway';
import { DmController } from './dm.controller';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { FriendsService } from 'src/friends/friends.service';
import { FriendsModule } from 'src/friends/friends.module';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';
import { BlockedUserModule } from 'src/blocked-user/blocked-user.module';

@Module({
  imports: [FriendsModule, UsersStatusModule, BlockedUserModule],
  controllers: [DmController],
  providers: [DmGateway, DmService, WsAuthGuard, FriendsService],
})
export class DmModule {}

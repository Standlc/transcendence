import { Module, forwardRef } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';
import { BlockedUserModule } from 'src/blocked-user/blocked-user.module';

@Module({
  imports: [forwardRef(() => BlockedUserModule), UsersStatusModule],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService]
})
export class FriendsModule {}

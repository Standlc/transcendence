import { Module, forwardRef } from '@nestjs/common';
import { BlockedUserService } from './blocked-user.service';
import { BlockedUserController } from './blocked-user.controller';
import { FriendsModule } from 'src/friends/friends.module';

@Module({
  imports: [forwardRef(() => FriendsModule)],
  controllers: [BlockedUserController],
  providers: [BlockedUserService],
  exports: [BlockedUserService]
})
export class BlockedUserModule {}

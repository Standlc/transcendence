import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';

@Module({
  imports: [UsersStatusModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}

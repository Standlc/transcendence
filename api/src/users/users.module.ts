import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';
import { BlockedUserModule } from 'src/blocked-user/blocked-user.module';

@Module({
  imports: [UsersStatusModule, BlockedUserModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}

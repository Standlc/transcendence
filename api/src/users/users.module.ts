import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersStatusModule } from 'src/usersStatusGateway/UsersStatus.module';

@Module({
  imports: [UsersStatusModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}

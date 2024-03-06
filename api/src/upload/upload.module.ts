import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { UsersModule } from 'src/users/users.module';
import { ChannelModule } from 'src/channel/channel.module';

@Module({
  imports: [UsersModule, ChannelModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}

import { Injectable } from '@nestjs/common';
import { ChannelService } from 'src/channel/channel.service';
import { AppUser } from 'src/types/clientSchema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UploadService {
  constructor (
    private readonly usersService: UsersService,
    private readonly channelsService: ChannelService
    ) {}

  async setUserAvatar(userId: number, path: string): Promise<AppUser> {
    return await this.usersService.setAvatar(userId, path);
  }

  async setChannelPhoto(userId: number, channelId: number, path: string): Promise<string> {
    return await this.channelsService.setPhoto(userId, channelId, path);
  }
}

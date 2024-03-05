import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChannelsService } from './Channels.service';

@Controller('channelsHttp')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get('/public')
  async getAllPublicChannels(@Request() req) {
    const userId: number = req.user.id;
    return await this.channelsService.getAllPublicChannels(userId);
  }

  @Post('/join/:channelId')
  async joinUserToChannel(
    @Request() req,
    @Param('channelId') channelId: number,
  ) {
    const userId: number = req.user.id;
    const isAllowed = await this.channelsService.checkCanUserJoinChannel(
      userId,
      channelId,
    );
    if (!isAllowed) {
      throw new ForbiddenException();
    }

    return await this.channelsService.joinUserToChannel(userId, channelId);
  }

  @Post('/add')
  async addUserToChannel(
    @Request() req,
    @Body() body: { userId: number; channelId: number },
  ) {
    const userId: number = req.user.id;
    if (userId === body.userId) {
      throw new ForbiddenException();
    }

    if (!body.userId) {
      throw new BadRequestException();
    }

    const isOwner = await this.channelsService.checkUserIsOwner(
      userId,
      body.channelId,
    );
    if (!isOwner) {
      throw new ForbiddenException();
    }

    const isAllowed = await this.channelsService.checkCanUserJoinChannel(
      body.userId,
      body.channelId,
    );
    if (!isAllowed) {
      throw new ForbiddenException();
    }

    return await this.channelsService.joinUserToChannel(
      body.userId,
      body.channelId,
    );
  }

  @Delete('/leave/:channelId')
  async removeUserFromChannel(
    @Request() req,
    @Param('channelId') channelId: number,
  ) {
    const userId: number = req.user.id;
    const isOwner = await this.channelsService.checkUserIsOwner(
      userId,
      channelId,
    );
    if (isOwner) {
      throw new ForbiddenException();
    }

    const isUserAMember = await this.channelsService.isUserAMember(
      userId,
      channelId,
    );
    if (!isUserAMember) {
      throw new NotFoundException();
    }

    return await this.channelsService.removeUserFromChannel(userId, channelId);
  }

  @Delete('/delete/:channelId')
  async deleteChannel(@Request() req, @Param('channelId') channelId: number) {
    const userId: number = req.user.id;
    const isOwner = await this.channelsService.checkUserIsOwner(
      userId,
      channelId,
    );
    if (!isOwner) {
      throw new ForbiddenException();
    }
    await this.channelsService.delete(channelId);
  }

  @Post('/kick')
  async kickMemberOut(
    @Request() req,
    @Body() body: { userId: number; channelId: number },
  ) {
    const userId: number = req.user.id;
    if (userId === body.userId) {
      throw new ForbiddenException();
    }

    const isUserAdminOrOwner =
      await this.channelsService.checkIsUserAdminOrOwner(
        userId,
        body.channelId,
      );
    if (!isUserAdminOrOwner) {
      throw new ForbiddenException();
    }

    const isUserAMember = await this.channelsService.isUserAMember(
      body.userId,
      body.channelId,
    );
    if (!isUserAMember) {
      throw new NotFoundException();
    }

    await this.channelsService.removeUserFromChannel(
      body.userId,
      body.channelId,
    );
  }

  @Post('/ban')
  async banMember(
    @Request() req,
    @Body() body: { userId: number; channelId: number },
  ) {
    const userId: number = req.user.id;
    if (userId === body.userId) {
      throw new ForbiddenException();
    }

    const isUserAdminOrOwner =
      await this.channelsService.checkIsUserAdminOrOwner(
        userId,
        body.channelId,
      );
    if (!isUserAdminOrOwner) {
      throw new ForbiddenException();
    }

    const isUserAMember = await this.channelsService.isUserAMember(
      body.userId,
      body.channelId,
    );
    if (!isUserAMember) {
      throw new NotFoundException();
    }

    const isUserBanned = await this.channelsService.isUserBanned(
      body.userId,
      body.channelId,
    );
    if (isUserBanned) {
      throw new ConflictException();
    }

    await this.channelsService.banMember(body.userId, userId, body.channelId);
    await this.channelsService.removeUserFromChannel(
      body.userId,
      body.channelId,
    );
  }

  @Delete('/unban')
  async unbanMember(
    @Request() req,
    @Body() body: { userId: number; channelId: number },
  ) {
    const userId: number = req.user.id;
    if (userId === body.userId) {
      throw new ForbiddenException();
    }

    const isUserAdminOrOwner =
      await this.channelsService.checkIsUserAdminOrOwner(
        userId,
        body.channelId,
      );
    if (!isUserAdminOrOwner) {
      throw new ForbiddenException();
    }

    const isUserBanned = await this.channelsService.isUserBanned(
      body.userId,
      body.channelId,
    );
    if (!isUserBanned) {
      throw new NotFoundException();
    }

    await this.channelsService.unbanMember(body.userId, body.channelId);
  }

  @Post('/mute')
  async muteMember(
    @Request() req,
    @Body() body: { userId: number; channelId: number },
  ) {
    const userId: number = req.user.id;
    if (userId === body.userId) {
      throw new ForbiddenException();
    }

    const isUserAdminOrOwner =
      await this.channelsService.checkIsUserAdminOrOwner(
        userId,
        body.channelId,
      );
    if (!isUserAdminOrOwner) {
      throw new ForbiddenException();
    }

    const isUserAMember = await this.channelsService.isUserAMember(
      body.userId,
      body.channelId,
    );
    if (!isUserAMember) {
      throw new NotFoundException();
    }

    await this.channelsService.muteUser(body.userId, body.channelId);
  }

  @Get('/test/:channelId')
  async getChannelTest(@Request() req, @Param('channelId') channelId: number) {
    const channelInfos = await this.channelsService.getChannelInfos(channelId);
    if (!channelInfos) {
      throw new NotFoundException();
    }
    return channelInfos;
  }
}

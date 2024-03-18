import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
  Res,
  ForbiddenException,
  BadRequestException,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import {
  ChannelAndUserIdPayload,
  ChannelBannedUser,
  ChannelCreationData,
  ChannelDataWithUsersWithoutPassword,
  ChannelJoinDto,
  ChannelUpdate,
  EligibleUserForChannel,
  MessageWithSenderInfo,
  PublicChannel,
  UserChannel,
} from 'src/types/channelsSchema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ZodValidationPipe } from 'src/ZodValidatePipe';
import { z } from 'zod';
import {
  ZodChannelAndUserIdPayload,
  ZodChannelCreationData,
  ZodChannelJoinDto,
  ZodChannelUpdate,
} from 'src/types/zodChannelsSchema';

const isWhitespaceString = (str: string) => !str.replace(/\s/g, '').length;

@UseGuards(JwtAuthGuard)
@ApiTags('channels')
@ApiBearerAuth()
@Controller('channels')
export class UserController {
  constructor(private readonly channelService: ChannelService) {}

  //
  //
  //
  @ApiOperation({ summary: 'Get all messages of a channel' })
  @ApiParam({
    name: 'channelId',
    description: 'Id of the channel',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Messages of the channel with sender info',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          channelId: {
            type: 'number',
          },
          messageContent: {
            type: 'string | null',
          },
          createdAt: {
            type: 'Date',
          },
          messageId: {
            type: 'number',
          },
          senderId: {
            type: 'number',
          },
          isOwner: {
            type: 'boolean',
          },
          isAdmin: {
            type: 'boolean',
          },
          isBanned: {
            type: 'boolean',
          },
          isMuted: {
            type: 'boolean',
          },
          mutedEnd: {
            type: 'Date | null',
          },
          avatarUrl: {
            type: 'string | null',
          },
          username: {
            type: 'string',
          },
          senderIsBlocked: {
            type: 'boolean',
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({
    description: 'Channel not found | User is not a member of the channel',
  })
  @ApiUnauthorizedResponse({ description: 'User is banned' })
  @Get(':channelId/messages')
  async getMessages(
    @Param('channelId', new ParseIntPipe()) channelId: number,
    @Request() req,
  ): Promise<MessageWithSenderInfo[]> {
    const userId: number = req.user.id;
    const isAllowed = await this.channelService.isUserMember(userId, channelId);
    if (!isAllowed) {
      throw new ForbiddenException();
    }
    return await this.channelService.getChannelMessages(userId, channelId);
  }

  @Get()
  async getAllChannelsOfTheUser(@Request() req): Promise<UserChannel[]> {
    return await this.channelService.getAllChannelsOfTheUser(req.user.id);
  }

  @Post()
  async createChannel(
    @Body(new ZodValidationPipe(ZodChannelCreationData))
    channel: ChannelCreationData,
    @Request() req,
  ): Promise<number> {
    if (
      isWhitespaceString(channel.name) ||
      (channel.password && isWhitespaceString(channel.password)) ||
      channel.name.length > 30 ||
      (channel.password?.length ?? 0) > 30
    ) {
      throw new BadRequestException();
    }
    if (channel.password && !channel.password.length) {
      throw new BadRequestException();
    }

    return await this.channelService.createChannel(channel, req.user.id);
  }

  @Get(':channelId/channel')
  async getChannel(
    @Param('channelId', new ParseIntPipe()) channelId: number,
    @Req() req,
  ): Promise<ChannelDataWithUsersWithoutPassword> {
    const userId: number = req.user.id;
    const isAllowed = await this.channelService.isUserMember(userId, channelId);
    if (!isAllowed) {
      throw new ForbiddenException();
    }
    return await this.channelService.getChannel(userId, channelId);
  }

  //
  //
  //
  @ApiOperation({ summary: 'Update a channel' })
  @ApiParam({
    name: 'channelId',
    description: 'Id of the channel',
    type: 'number',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isPublic: {
          type: 'boolean',
        },
        name: {
          type: 'string',
        },
        password: {
          type: 'string | null',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Channel updated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'Channel not found' })
  @ApiUnprocessableEntityResponse({
    description:
      'No data to update | \
      Invalid channel name length (1-49) | \
      A public channel cannot have a password | \
      Channel name already exists | \
      Invalid isPublic value | \
      Invalid password length | \
      Password must contain a letter | \
      Password must contain a number | \
      Password must contain a special character !@#$%^&* | \
      Password can only contain letters, numbers, and special characters !@#$%^&* | \
      Unable to hash password |',
  })
  @ApiUnauthorizedResponse({
    description:
      'Only the owner can change the channel status \
      | Only the owner can change the channel password',
  })
  @Put(':channelId')
  async updateChannel(
    @Param('channelId', new ParseIntPipe()) channelId: number,
    @Body(new ZodValidationPipe(ZodChannelUpdate)) channel: ChannelUpdate,
    @Request() req,
  ) {
    const userId: number = req.user.id;
    const canUserUpdateChannel = this.channelService.canUserUpdateChannel(
      userId,
      channelId,
    );
    if (!canUserUpdateChannel) {
      throw new ForbiddenException();
    }

    if (
      (channel.name && isWhitespaceString(channel.name)) ||
      (channel.password && isWhitespaceString(channel.password)) ||
      (channel.name?.length ?? 0) > 30 ||
      (channel.password?.length ?? 0) > 30
    ) {
      throw new BadRequestException();
    }

    await this.channelService.updateChannel(channelId, channel);
  }

  @Get('/public')
  async getAllPublicChannels(@Request() req): Promise<PublicChannel[]> {
    const userId: number = req.user.id;
    return await this.channelService.getAllPublicChannels(userId);
  }

  //#region Get Photo

  @ApiOperation({ summary: 'Get the photoUrl using fileId' })
  @ApiCookieAuth()
  @ApiParam({ name: 'fileId', description: 'Should start with /api/channels' })
  @ApiOkResponse({ description: 'Image file' })
  @ApiNotFoundResponse({ description: 'No such file exist' })
  @UseGuards(JwtAuthGuard)
  @Get('photo/:fileId')
  async getPhoto(
    @Param('fileId', new ZodValidationPipe(z.string())) fileId,
    @Res() res,
  ) {
    res.sendFile(fileId, { root: './public/channels' });
  }

  @Post('/join')
  async joinUserToChannel(
    @Request() req,
    @Body(new ZodValidationPipe(ZodChannelJoinDto)) payload: ChannelJoinDto,
  ) {
    const userId: number = req.user.id;
    const isAllowed = await this.channelService.checkCanUserJoinChannel(
      userId,
      payload,
    );
    if (!isAllowed) {
      throw new ForbiddenException();
    }

    return await this.channelService.joinUserToChannel(
      userId,
      payload.channelId,
    );
  }

  @Delete('/delete/:channelId')
  async deleteChannel(
    @Req() req,
    @Param('channelId', new ParseIntPipe()) channelId: number,
  ) {
    const userId: number = req.user.id;
    const canUserDeleteChannel = await this.channelService.canUserDeleteChannel(
      userId,
      channelId,
    );
    if (!canUserDeleteChannel) {
      throw new ForbiddenException();
    }

    await this.channelService.deleteChannel(channelId);
  }

  @Post('/add-admin')
  async addAdmin(
    @Req() req,
    @Body(new ZodValidationPipe(ZodChannelAndUserIdPayload))
    payload: ChannelAndUserIdPayload,
  ) {
    const userId: number = req.user.id;
    const canUserBeAdmin = await this.channelService.canUserBeAdmin(
      userId,
      payload.userId,
      payload.channelId,
    );
    if (!canUserBeAdmin) {
      throw new ForbiddenException();
    }
    await this.channelService.changeMemberAdmin(
      payload.userId,
      payload.channelId,
      true,
    );
  }

  @Post('/remove-admin')
  async removeAdmin(
    @Req() req,
    @Body(new ZodValidationPipe(ZodChannelAndUserIdPayload))
    payload: ChannelAndUserIdPayload,
  ) {
    const userId: number = req.user.id;
    const canUserBeNotAdmin = await this.channelService.canUserBeNotAdmin(
      userId,
      payload.userId,
      payload.channelId,
    );
    if (!canUserBeNotAdmin) {
      throw new ForbiddenException();
    }
    await this.channelService.changeMemberAdmin(
      payload.userId,
      payload.channelId,
      false,
    );
  }

  @Post('/mute')
  async muteMember(
    @Req() req,
    @Body(new ZodValidationPipe(ZodChannelAndUserIdPayload))
    payload: ChannelAndUserIdPayload,
  ) {
    const userId: number = req.user.id;
    const canUserBeMuted = await this.channelService.canUserBeMuted(
      userId,
      payload.userId,
      payload.channelId,
    );
    if (!canUserBeMuted) {
      throw new ForbiddenException();
    }
    await this.channelService.muteMember(payload.userId, payload.channelId);
  }

  @Post('/kick')
  async kickUserFromChannel(
    @Req() req,
    @Body(new ZodValidationPipe(ZodChannelAndUserIdPayload))
    payload: ChannelAndUserIdPayload,
  ) {
    const userId: number = req.user.id;
    const canUserBeKicked = await this.channelService.canUserBeKicked(
      userId,
      payload.userId,
      payload.channelId,
    );
    if (!canUserBeKicked) {
      throw new ForbiddenException();
    }
    await this.channelService.removeMemberFromChannel(
      payload.userId,
      payload.channelId,
    );
  }

  @Delete('/leave/:channelId')
  async leaveChannel(
    @Req() req,
    @Param('channelId', new ParseIntPipe()) channelId: number,
  ) {
    const userId: number = req.user.id;
    const canLeaveChannel = await this.channelService.canUserLeaveChannel(
      userId,
      channelId,
    );
    if (!canLeaveChannel) {
      throw new ForbiddenException();
    }

    await this.channelService.removeMemberFromChannel(userId, channelId);
  }

  @Post('/ban')
  async banUserFromChannel(
    @Req() req,
    @Body(new ZodValidationPipe(ZodChannelAndUserIdPayload))
    payload: ChannelAndUserIdPayload,
  ) {
    const userId: number = req.user.id;
    const canUserBeBanned = await this.channelService.canUserBanUser(
      userId,
      payload.userId,
      payload.channelId,
    );
    if (!canUserBeBanned) {
      throw new ForbiddenException();
    }
    await this.channelService.banUser(
      userId,
      payload.userId,
      payload.channelId,
    );
  }

  @Post('/unban')
  async unbanUserFromChannel(
    @Req() req,
    @Body(new ZodValidationPipe(ZodChannelAndUserIdPayload))
    payload: ChannelAndUserIdPayload,
  ) {
    const userId: number = req.user.id;
    const canUserBeUnbanned = await this.channelService.canUserBeUnbanned(
      userId,
      payload.userId,
      payload.channelId,
    );
    if (!canUserBeUnbanned) {
      throw new ForbiddenException();
    }
    await this.channelService.unbanUser(payload.userId, payload.channelId);
  }

  @Get('/banned/:channelId')
  async getBannedUsersFromChannel(
    @Param('channelId', new ParseIntPipe()) channelId: number,
    @Req() req,
  ): Promise<ChannelBannedUser[]> {
    const userId: number = req.user.id;
    const isAllowed = await this.channelService.isUserMember(userId, channelId);
    if (!isAllowed) {
      throw new ForbiddenException();
    }
    return await this.channelService.getBannedUsersFromChannel(channelId);
  }

  @Post('/add-member')
  async addUserToChannel(
    @Body(new ZodValidationPipe(ZodChannelAndUserIdPayload))
    payload: ChannelAndUserIdPayload,
    @Req() req,
  ) {
    const userId: number = req.user.id;
    const isAllowed = await this.channelService.canUserAddMember(
      userId,
      payload.userId,
      payload.channelId,
    );
    if (!isAllowed) {
      throw new ForbiddenException();
    }
    await this.channelService.joinUserToChannel(
      payload.userId,
      payload.channelId,
    );
  }

  @Get('/eligible-users/:channelId')
  async getEligibleUsersForChannel(
    @Param('channelId', new ParseIntPipe()) channelId: number,
    @Req() req,
  ): Promise<EligibleUserForChannel[]> {
    const userId: number = req.user.id;

    const eligibleUsers = await this.channelService.getEligibleUsersForChannel(
      userId,
      channelId,
    );
    return eligibleUsers;
  }
}

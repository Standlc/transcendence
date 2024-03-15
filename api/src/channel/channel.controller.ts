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
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import {
  ChannelCreationData,
  ChannelDataWithUsersWithoutPassword,
  ChannelJoinDto,
  ChannelUpdate,
  MessageWithSenderInfo,
  PublicChannel,
  UserChannel,
} from 'src/types/channelsSchema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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
    @Param('channelId') channelId: number,
    @Request() req,
  ): Promise<MessageWithSenderInfo[]> {
    console.log('GET: Recieved channelId:', channelId);
    return await this.channelService.getChannelMessages(req.user.id, channelId);
  }

  @Get()
  async getAllChannelsOfTheUser(@Request() req): Promise<UserChannel[]> {
    return await this.channelService.getAllChannelsOfTheUser(req.user.id);
  }

  //
  //
  //
  @ApiOperation({ summary: 'Create a new channel' })
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
        photoUrl: {
          type: 'string | null',
        },
        password: {
          type: 'string | null',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Channels found',
    schema: {
      type: 'object',
      properties: {
        channelOwner: {
          type: 'number',
        },
        createdAt: {
          type: 'Date',
        },
        id: {
          type: 'number',
        },
        isPublic: {
          type: 'boolean',
        },
        name: {
          type: 'string',
        },
        photoUrl: {
          type: 'string | null',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiUnprocessableEntityResponse({
    description:
      'Invalid channel name length (1-49) | \
      Invalid photo url length (1-49) | \
      A public channel cannot have a password | \
      Channel name already exists | \
      Invalid password length | \
      Password must contain a letter | \
      Password must contain a number | \
      Password must contain a special character !@#$%^&* | \
      Password can only contain letters, numbers, and special characters !@#$%^&*',
  })
  @Post()
  async createChannel(
    @Body() channel: ChannelCreationData,
    @Request() req,
  ): Promise<number> {
    const isWhitespaceString = (str: string) => !str.replace(/\s/g, '').length;
    if (
      isWhitespaceString(channel.name) ||
      (channel.password && isWhitespaceString(channel.password))
    ) {
      throw new BadRequestException();
    }
    return await this.channelService.createChannel(channel, req.user.id);
  }

  //
  //
  //
  @ApiOperation({ summary: 'Get a channel' })
  @ApiParam({
    name: 'channelId',
    description: 'Id of the channel',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Channel found',
    schema: {
      type: 'object',
      properties: {
        channelOwner: {
          type: 'number',
        },
        createdAt: {
          type: 'Date',
        },
        id: {
          type: 'number',
        },
        isPublic: {
          type: 'boolean',
        },
        name: {
          type: 'string',
        },
        photoUrl: {
          type: 'string | null',
        },
        schema: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
            },
            username: {
              type: 'string',
            },
            avatarUrl: {
              type: 'string',
            },
            rating: {
              type: 'number',
            },
            status: {
              type: 'number',
            },
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'Channel not found' })
  @Get(':channelId/channel')
  async getChannel(
    @Param('channelId') channelId: number,
  ): Promise<ChannelDataWithUsersWithoutPassword> {
    console.log('GET: Recieved channelId:', channelId);
    return await this.channelService.getChannel(channelId);
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
    @Param('channelId') channelId: number,
    @Body() channel: ChannelUpdate,
    @Request() req,
  ): Promise<string> {
    console.log('PUT: Recieved id:', channelId);
    return await this.channelService.updateChannel(
      channelId,
      channel,
      req.user.id,
    );
  }

  //
  //
  //
  @ApiOperation({ summary: 'Delete a channel' })
  @ApiParam({
    name: 'channelId',
    description: 'Id of the channel',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Channel deleted' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'Channel not found' })
  @ApiUnauthorizedResponse({
    description: 'Only the owner can delete this channel',
  })
  @Delete(':channelId')
  async deleteChannel(
    @Param('channelId') channelId: number,
    @Request() req,
  ): Promise<string> {
    console.log('DELETE: Received channelId:', channelId);
    return await this.channelService.deleteChannel(channelId, req.user.id);
  }

  @Get('/public')
  async getAllPublicChannels(@Request() req): Promise<PublicChannel[]> {
    const userId: number = req.user.id;
    console.log('public');
    return await this.channelService.getAllPublicChannels(userId);
  }

  @Post('/join')
  async joinUserToChannel(@Request() req, @Body() payload: ChannelJoinDto) {
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

  //#region Get Photo

  @ApiOperation({ summary: 'Get the photoUrl using fileId' })
  @ApiCookieAuth()
  @ApiParam({ name: 'fileId', description: 'Should start with /api/channels' })
  @ApiOkResponse({ description: 'Image file' })
  @ApiNotFoundResponse({ description: 'No such file exist' })
  @UseGuards(JwtAuthGuard)
  @Get('photo/:fileId')
  async getPhoto(@Param('fileId') fileId, @Res() res) {
    res.sendFile(fileId, { root: './public/channels' });
  }

  //#endregion
}

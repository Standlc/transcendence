import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Channel } from './../types/schema';
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
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import {
  ChannelCreationData,
  ChannelDataWithoutPassword,
  MessageWithSenderInfo,
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
          avatarUrl: {
            type: 'string | null',
          },
          username: {
            type: 'string',
          },
          channelId: {
            type: 'number',
          },
          messageContent: {
            type: 'string | null',
          },
          createdAt: {
            type: 'Generated<Timestamp>',
          },
          messageId: {
            type: 'Generated<number>',
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
          isBlockedByUserIds: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({
    description:
      'User not found | Channel not found | User is not a member of the channel | No messages found',
  })
  @ApiUnauthorizedResponse({ description: 'User is banned' })
  @Get(':channelId/messages')
  getMessages(
    @Param('channelId') channelId: number,
    @Request() req,
  ): Promise<MessageWithSenderInfo[]> {
    console.log('GET: Recieved channelId:', channelId);
    return this.channelService.getChannelMessages(req.user.id, channelId);
  }

  //
  //
  //
  @ApiOperation({
    summary: 'Get all channels where the user in member and not banned',
  })
  @ApiOkResponse({
    description: 'Channels found',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          channelOwner: {
            type: 'number',
          },
          createdAt: {
            type: 'Generated<Timestamp>',
          },
          id: {
            type: 'Generated<number>',
          },
          isPublic: {
            type: 'Generated<boolean>',
          },
          name: {
            type: 'string',
          },
          photoUrl: {
            type: 'string | null',
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'User not found | No channels found' })
  @Get()
  async getAllChannelsOfTheUser(
    @Request() req,
  ): Promise<ChannelDataWithoutPassword[]> {
    console.log('GET: Recieved all channels of the user: ', req.user.id);
    return this.channelService.getAllChannelsOfTheUser(req.user.id);
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
          type: 'Generated<Timestamp>',
        },
        id: {
          type: 'Generated<number>',
        },
        isPublic: {
          type: 'Generated<boolean>',
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
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnprocessableEntityResponse({
    description:
      'A public channel cannot have a password | Invalid channel name length | Channel name already exists',
  })
  @Post()
  createChannel(
    @Body() channel: ChannelCreationData,
    @Request() req,
  ): Promise<ChannelDataWithoutPassword> {
    console.log('POST: Recieved name:', channel.name);
    return this.channelService.createChannel(channel, req.user.id);
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
          type: 'Generated<Timestamp>',
        },
        id: {
          type: 'Generated<number>',
        },
        isPublic: {
          type: 'Generated<boolean>',
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
  @ApiNotFoundResponse({ description: 'User not found | Channel not found' })
  @Get(':channelId')
  async getChannel(
    @Param('channelId') channelId: number,
    @Request() req,
  ): Promise<ChannelDataWithoutPassword> {
    console.log('GET: Recieved channelId:', channelId);
    return this.channelService.getChannel(channelId, req.user.id);
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
        channelOwner: {
          type: 'number',
        },
        createdAt: {
          type: 'Generated<Timestamp>',
        },
        id: {
          type: 'Generated<number>',
        },
        isPublic: {
          type: 'Generated<boolean>',
        },
        name: {
          type: 'string',
        },
        password: {
          type: 'string | null',
        },
        photoUrl: {
          type: 'string | null',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Channel updated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'User not found | Channel not found' })
  @ApiUnprocessableEntityResponse({
    description:
      'Invalid channel name length | Channel name already exists | Same as current or Invalid photoUrl | Invalid photoUrl',
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid password | Only the owner or the admin can update this data',
  })
  @Put(':channelId')
  updateChannel(
    @Param('channelId') channelId: number,
    @Body() channel: Channel,
    @Request() req,
  ): Promise<string> {
    console.log('PUT: Recieved id:', channelId);
    return this.channelService.updateChannel(channelId, channel, req.user.id);
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
  @ApiNotFoundResponse({ description: 'User not found | Channel not found' })
  @ApiUnauthorizedResponse({
    description: 'Only the owner can delete this channel',
  })
  @Delete(':channelId')
  deleteChannel(@Param('channelId') channelId: number, @Request() req) {
    console.log('DELETE: Received channelId:', channelId);
    return this.channelService.deleteChannel(channelId, req.user.id);
  }
}

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
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import {
  ChannelCreationData,
  ChannelDataWithoutPassword,
  ChannelUpdate,
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
            type: 'Date',
          },
          id: {
            type: 'number',
          },
          isPublic: {
            type: 'boolean',
          },
          users: {
            type: 'array',
            items: {
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
              },
            },
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
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
          type: 'Date',
        },
        id: {
          type: 'number',
        },
        isPublic: {
          type: 'boolean',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'Channel not found' })
  @Get(':channelId')
  async getChannel(
    @Param('channelId') channelId: number,
  ): Promise<ChannelDataWithoutPassword> {
    console.log('GET: Recieved channelId:', channelId);
    return this.channelService.getChannel(channelId);
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
        photoUrl: {
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
      Invalid photoUrl length (1-49) | \
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
  updateChannel(
    @Param('channelId') channelId: number,
    @Body() channel: ChannelUpdate,
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
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'Channel not found' })
  @ApiUnauthorizedResponse({
    description: 'Only the owner can delete this channel',
  })
  @Delete(':channelId')
  deleteChannel(@Param('channelId') channelId: number, @Request() req) {
    console.log('DELETE: Received channelId:', channelId);
    return this.channelService.deleteChannel(channelId, req.user.id);
  }

    //#region Get Photo

    @ApiOperation({summary: "Get the photoUrl using fileId"})
    @ApiCookieAuth()
    @ApiParam({name: 'fileId', description: 'Should start with /api/channels'})
    @ApiOkResponse({description: "Image file"})
    @ApiNotFoundResponse({description: "No such file exist"})
    @UseGuards(JwtAuthGuard)
    @Get('photo/:fileId')
    async getPhoto(@Param('fileId') fileId, @Res() res) {
      res.sendFile(fileId, { root: './public/channels' });
    }

    //#endregion
}

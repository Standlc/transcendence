import {
  AllConversationsPromise,
  DmWithSenderInfo,
  UserConversation,
  UserId,
} from './../types/channelsSchema';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DmService } from './dm.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiUnprocessableEntityResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('dm')
@Controller('dm')
export class DmController {
  constructor(private readonly dmService: DmService) {}

  //
  //
  //
  @ApiOperation({ summary: 'Create a conversation' })
  @ApiBody({
    schema: { type: 'object', properties: { userId: { type: 'number' } } },
  })
  @ApiOkResponse({
    description: 'Conversation of user 1 and user 2 created',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiUnprocessableEntityResponse({
    description: 'Cannot create conversation with yourself',
  })
  @ApiNotFoundResponse({
    description: 'User not found | Users are not friends',
  })
  @ApiConflictResponse({
    description: 'Conversation already exists',
  })
  @ApiUnauthorizedResponse({ description: 'User 1 blocked user 2' })
  @Post()
  async createConveration(
    @Body() userId: UserId,
    @Request() req,
  ): Promise<string> {
    return await this.dmService.createConversation(userId.userId, req.user.id);
  }

  //
  //
  //
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          createdAt: {
            type: 'string',
          },
          user1: {
            type: 'object',
            properties: {
              userId: {
                type: 'number',
              },
              avatarUrl: {
                type: 'string',
              },
              username: {
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
          user2: {
            type: 'object',
            properties: {
              userId: {
                type: 'number',
              },
              avatarUrl: {
                type: 'string',
              },
              username: {
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
    },
  })
  @ApiNotFoundResponse({ description: 'No conversations found for this user' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get()
  async getAllConversationsOfTheUser(
    @Request() req,
  ): Promise<AllConversationsPromise[]> {
    return await this.dmService.getAllConversationsOfTheUser(req.user.id);
  }

  //
  //
  //
  @ApiOperation({ summary: 'Find a conversation' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('findDmId/:userId')
  async findDmId(
    @Param('userId') userId: number,
    @Request() req,
  ): Promise<number> {
    return await this.dmService.findDmId(userId, req.user.id);
  }

  //
  //
  //
  @ApiOperation({ summary: 'Get a conversation' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
        createdAt: {
          type: 'string',
        },
        user1: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
            },
            avatarUrl: {
              type: 'string',
            },
            username: {
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
        user2: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
            },
            avatarUrl: {
              type: 'string',
            },
            username: {
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
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':id')
  async getConversation(
    @Param('id') id: string,
    @Request() req,
  ): Promise<UserConversation> {
    return await this.dmService.getConversation(Number(id), req.user.id);
  }

  //
  //
  //
  @ApiOperation({ summary: 'Get all messages of a conversation' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          content: {
            type: 'string | null',
          },
          conversationId: {
            type: 'number',
          },
          createdAt: {
            type: 'string',
          },
          messageId: {
            type: 'number',
          },
          senderId: {
            type: 'number',
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
  @ApiNotFoundResponse({
    description: 'Conversation not found',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':id/messages')
  async getConversationMessages(
    @Param('id') id: string,
    @Request() req,
  ): Promise<DmWithSenderInfo[]> {
    return await this.dmService.getConversationMessages(
      Number(id),
      req.user.id,
    );
  }

  //
  //
  //
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiOkResponse({ description: 'Conversation deleted' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @Delete(':id')
  async deleteConversation(
    @Param('id') id: string,
    @Request() req,
  ): Promise<string> {
    return await this.dmService.deleteConversation(Number(id), req.user.id);
  }
}

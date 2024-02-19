import { DmWithSenderInfo, UserId } from './../types/channelsSchema';
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
import { Conversation } from '../types/schema';
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
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
        createdAt: {
          type: 'string',
        },
        user1_id: {
          type: 'number',
        },
        user2_id: {
          type: 'number',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiUnprocessableEntityResponse({
    description:
      'Cannot create conversation with yourself | Conversation already exists',
  })
  @ApiNotFoundResponse({
    description: 'User not found | Users are not friends',
  })
  @Post()
  createConveration(
    @Body() userId: UserId,
    @Request() req,
  ): Promise<Conversation> {
    return this.dmService.createConversation(userId.userId, req.user.id);
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
          user1_id: {
            type: 'number',
          },
          user2_id: {
            type: 'number',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No conversations found for this user' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get()
  getAllConversationsOfTheUser(@Request() req): Promise<Conversation[]> {
    return this.dmService.getAllConversationsOfTheUser(req.user.id);
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
        user1_id: {
          type: 'number',
        },
        user2_id: {
          type: 'number',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':id')
  getConversation(
    @Param('id') id: string,
    @Request() req,
  ): Promise<Conversation> {
    return this.dmService.getConversation(Number(id), req.user.id);
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
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Conversation not found | No messages found',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':id/messages')
  getConversationMessages(
    @Param('id') id: string,
    @Request() req,
  ): Promise<DmWithSenderInfo[]> {
    return this.dmService.getConversationMessages(Number(id), req.user.id);
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
  deleteConversation(@Param('id') id: string, @Request() req): Promise<string> {
    return this.dmService.deleteConversation(Number(id), req.user.id);
  }
}

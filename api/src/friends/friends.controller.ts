import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Selectable } from 'kysely';
import { Friend, FriendRequest } from 'src/types/schema';
import { ApiBody, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  //#region <-- Request -->
  @ApiCreatedResponse({
    description: "Friend request sent, or added",
    schema: {
      type: 'string',
      examples: {
        sent: {
          value: 'Request sent',
          summary: "Friend request was succesfuly sent"
        },
        added: {
          value: "Friend added",
          summary: "Request someone who also sent you a request, you are now friend"
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: "This status is return if you request as friend yourself or a friend."
  })
  @ApiInternalServerErrorResponse({
    description: "Whenever the backend fail in some point, probably an error with the db."
  })
  @ApiBody({
    type: CreateFriendDto,
    description: "The user id of who you wish to send a friend request."
  })
  @UseGuards(JwtAuthGuard)
  @Post('request')
  async addFriend(@Request() req, @Body() createFriendDto: CreateFriendDto): Promise<string> {
    try {
      // ? Before creating a friend request, we check if we didn't have a friend request from the target.
      return await this.friendsService.acceptRequest(createFriendDto.targetId, req.user.id);
    } catch(NotFoundException) {
      // ? As we didn't have a friendRequest, we can now create a request.
      return await this.friendsService.requestAFriend(req.user.id, createFriendDto.targetId);
    }
  }

  @ApiOkResponse({
    description: "An array of every friend request.",
    schema: {
      type: 'object',
      properties: {
        createdAt: {
          type: 'string'
        },
        friendId: {
          type: 'integer'
        },
        userId: {
          type: 'integer'
        }
      }
    },
    isArray: true
  })
  @ApiNotFoundResponse({
    description: "No request found."
  })
  @UseGuards(JwtAuthGuard)
  @Get('request')
  async findAllRequest(@Request() req): Promise<Selectable<FriendRequest>[]> {
    return await this.friendsService.findAllRequest(req.user.id);
  }

  @ApiCreatedResponse({
    description: "Request succesfuly accepted.",
    schema: {
      type: 'string',
      example: 'Friend added'
    }
  })
  @ApiNotFoundResponse({
    description: "You tried to accept a request that doesn't exist."
  })
  @ApiInternalServerErrorResponse({
    description: "Whenever the backend fail in some point, probably an error with the db."
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: "The user id of who issue the friend request."
  })
  @UseGuards(JwtAuthGuard)
  @Post('request/:id')
  async acceptRequest(@Request() req, @Param('id') id: number): Promise<string> {
    return await this.friendsService.acceptRequest(id, req.user.id);
  }

  @ApiOkResponse({
    description: "Request was succesfuly removed.",
    schema: {
      type: 'string',
      example: 'Request denied'
    }
  })
  @ApiNotFoundResponse({
    description: "You tried to denied a request that doesn't exist."
  })
  @ApiInternalServerErrorResponse({
    description: "Whenever the backend fail in some point, probably an error with the db."
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: "The user id of who issue the friend request."
  })
  @UseGuards(JwtAuthGuard)
  @Delete('request/:id')
  async deleteRequest(@Request() req, @Param('id') id: number): Promise<string> {
    return await this.friendsService.removeRequest(id, req.user.id);
  }

  //#endregion

  //#region <-- Friends -->

  @ApiOkResponse({
    description: "Return an array of friend object",
    schema: {
      type: 'object',
      properties: {
        createAt: {
          type: 'string'
        },
        friendId: {
          type: 'integer'
        },
        userId: {
          type: 'integer'
        }
      }
    },
    isArray: true
  })
  @ApiNotFoundResponse({
    description: "No friend found."
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllFriends(@Request() req): Promise<Selectable<Friend>[]> {
    return await this.friendsService.findAllFriends(req.user.id);
  }

  @ApiOkResponse({
    description: "Succesfuly remove id from friend list.",
    schema: {
      type: 'string',
      example: "Friend deleted"
    }
  })
  @ApiNotFoundResponse({
    description: "You are not friend with this id"
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: "The user id of the friend you wish to remove."
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: number): Promise<string> {
    return await this.friendsService.remove(req.user.id, id);
  }

  //#endregion
}

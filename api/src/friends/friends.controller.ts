import { Controller, Get, Post, Param, Delete, UseGuards, Request, Query, NotFoundException } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiCookieAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { AppUser, ListUsers } from 'src/types/clientSchema';

@ApiTags('friends')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth()
@ApiInternalServerErrorResponse({ description: "Whenever the backend fail in some point, probably an error with the db." })
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  //#region <-- Request -->

  //#region AddFriend
  @ApiCreatedResponse({
    description: "Friend request sent, but this endpoint will return 'Friend added' if you tried to request someone who already request you",
    schema: {
      type: 'string',
      enum: ['Request sent', 'Friend added'],
      example: 'Request sent',
    }
  })
  @ApiUnprocessableEntityResponse({
    description: "This status is return if you request someone who is already your friend, yourself or you already sent a request."
  })
  @ApiNotFoundResponse({
    description: "Tried to send a request to a user who doesn't exist."
  })
  @ApiQuery({
    name: 'id',
    required: true,
    description: "The user id of who you wish to send a friend request."
  })
  @Post('request')
  async addFriend(@Request() req, @Query('id') id: number): Promise<string> {
    try {
      // ? Before creating a friend request, we check if we didn't have a friend request from the target.
      return await this.friendsService.acceptRequest(id, req.user.id);
    } catch(error) {
      // ? As we didn't have a friendRequest, we can now create a request.
      if (error instanceof NotFoundException)
        return await this.friendsService.requestAFriend(req.user.id, id);
      else
        throw error;
    }
  }
  //#endregion

  //#region GetAllFriendRequest
  @ApiOkResponse({
    description: "An array of every user who request sent you a request.",
    schema: {
      type: 'object',
      properties: {
        avatarUrl: {
          type: 'string'
        },
        username: {
          type: 'string'
        },
        id: {
          type: 'integer'
        }
      }
    },
    isArray: true
  })
  @ApiNotFoundResponse({
    description: "No request was found."
  })
  @Get('request')
  async findAllRequest(@Request() req): Promise<ListUsers[]> {
    return await this.friendsService.findAllRequest(req.user.id);
  }
  //#endregion

  //#region AcceptARequest
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
  @ApiQuery({
    name: 'id',
    required: true,
    description: "The user id of who issue the friend request you wish to accept."
  })
  @Post('accept')
  async acceptRequest(@Request() req, @Query('id') id: number): Promise<string> {
    return await this.friendsService.acceptRequest(id, req.user.id);
  }
  //#endregion

  //#region DeleteARequest
  @ApiOkResponse({
    description: "Request was succesfuly denied.",
    schema: {
      type: 'string',
      example: 'Request denied'
    }
  })
  @ApiNotFoundResponse({
    description: "You tried to denied a request that doesn't exist."
  })
  @ApiQuery({
    name: 'id',
    required: true,
    description: "The user id of who issue the friend request you wish to deny."
  })
  @Delete('deny')
  async deleteRequest(@Request() req, @Query('id') id: number): Promise<string> {
    return await this.friendsService.removeRequest(id, req.user.id);
  }
  //#endregion

  //#endregion

  //#region <-- Friends -->

  //#region GetAllFriend
  @ApiOkResponse({
    description: "Return an array of friend object",
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string'
        },
        avatarUrl: {
          type: 'string'
        },
        id: {
          type: 'integer'
        }
      }
    },
    isArray: true
  })
  @ApiNotFoundResponse({
    description: "No friend was found."
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: "The user id of who you want to get a friend list, if not specified, the friend list of yourself is returned. "
  })
  @Get()
  async findAllFriends(@Request() req, @Query('id') id: number): Promise<AppUser[]> {
    if (id)
      return await this.friendsService.findAllFriends(id);
    return await this.friendsService.findAllFriends(req.user.id);
  }
  //#endregion

  //#region Remove a Friend
  @ApiOkResponse({
    description: "Succesfuly remove id from friend list.",
    schema: {
      type: 'string',
      example: "Friend deleted"
    }
  })
  @ApiUnprocessableEntityResponse({
    description: "You are not friend with this user"
  })
  @ApiQuery({
    name: 'id',
    required: true,
    description: "The user id of the friend you wish to remove."
  })
  @Delete()
  async remove(@Request() req, @Query('id') id: number): Promise<string> {
    return await this.friendsService.remove(req.user.id, id);
  }
  //#endregion

  //#endregion
}

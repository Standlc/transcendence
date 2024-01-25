import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Selectable } from 'kysely';
import { Friend, FriendRequest } from 'src/types/schema';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async addFriend(@Request() req, @Body() createFriendDto: CreateFriendDto): Promise<boolean> {
    // ? Before creating a friend request, we check if we didn't have a friend request from the target.
    let result = await this.friendsService.acceptRequest(createFriendDto.targetId, req.user.id);
    if (!result) {
      // ? As we didnt have a friendRequest, we can now create a request.
      result = await this.friendsService.requestAFriend(req.user.id, createFriendDto.targetId);
    }
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('request')
  async findAllRequest(@Request() req): Promise<Selectable<FriendRequest>[]> {
    return await this.friendsService.findAllRequest(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request/:id')
  async acceptRequest(@Request() req, @Param('id') id: number): Promise<boolean> {
    return await this.friendsService.acceptRequest(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('request/:id')
  async deleteRequest(@Request() req, @Param('id') id: number): Promise<boolean> {
    return await this.friendsService.removeRequest(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllFriends(@Request() req): Promise<Selectable<Friend>[] | undefined> {
    return await this.friendsService.findAllFriends(req.user.id);
  }

//   @UseGuards(JwtAuthGuard)
//   @Get(':id')
//   async findAllFriends(@Request() req, @Param('id') id: number) {
//     return this.friendsService.findAllFriends();
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateFriendDto: UpdateFriendDto) {
//     return this.friendsService.update(+id, updateFriendDto);
//   }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: number): Promise<boolean> {
    return await this.friendsService.remove(req.user.id, id);
  }
}

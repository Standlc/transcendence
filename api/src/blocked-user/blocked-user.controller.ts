import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { BlockedUserService } from './blocked-user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BlockedUser } from 'src/types/clientSchema';

@Controller('blocked-user')
export class BlockedUserController {
  constructor(private readonly blockedUserService: BlockedUserService) {}

    //#region BlockAUser

    @UseGuards(JwtAuthGuard)
    @Post('block')
    async blockAUser(@Request() req, @Query('blockedId') blockedId) {
      await this.blockedUserService.blockAUser(req.user.id, blockedId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('unblock')
    async unblockAUser(@Request() req, @Query('blockedId') blockedId) {
      await this.blockedUserService.unblockAUser(req.user.id, blockedId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('list')
    async listBlockedUser(@Request() req): Promise<BlockedUser[]> {
      return await this.blockedUserService.listBlockedUser(req.user.id);
    }

    //#endregion
}

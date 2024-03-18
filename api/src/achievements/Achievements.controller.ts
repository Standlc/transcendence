import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AchievementsService } from './Achievements.service';
import { Achievement } from 'src/types/schema';
import { Selectable } from 'kysely';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('/:userId')
  async getUserAchievements(
    @Param('userId', new ParseIntPipe()) userId: number,
  ): Promise<Selectable<Achievement>[]> {
    await this.usersService.getUserById(userId);

    const achievements = await this.achievementsService
      .getUserAchievementQuery(userId)
      .execute();

    return achievements;
  }
}

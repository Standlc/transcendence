import { Body, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AchievementsService } from './Achievements.service';
import { Achievement } from 'src/types/schema';
import { Selectable } from 'kysely';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { ZodValidationPipe } from 'src/ZodValidatePipe';
import { z } from 'zod';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('/:userId')
  async getUserAchievements(
    @Param('userId', new ZodValidationPipe(z.string())) userId: string,
  ): Promise<Selectable<Achievement>[]> {
    await this.usersService.getUserById(Number(userId));

    const achievements = await this.achievementsService
      .getUserAchievementQuery(Number(userId))
      .execute();

    return achievements;
  }
}

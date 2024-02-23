import { Module } from '@nestjs/common';
import { AchievementsService } from './Achievements.service';
import { PlayersModule } from 'src/pong/players/players.module';
import { AchievementsController } from './Achievements.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [PlayersModule, UsersModule],
  providers: [AchievementsService],
  controllers: [AchievementsController],
  exports: [AchievementsService],
})
export class AchievementsModule {}

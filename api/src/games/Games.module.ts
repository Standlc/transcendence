import { Module, forwardRef } from '@nestjs/common';
import { GamesService } from './games.service';
import { PongGameModule } from 'src/pong/Pong.module';
import { GamesController } from './games.controller';

@Module({
  imports: [forwardRef(() => PongGameModule)],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}

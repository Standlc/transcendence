import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmGateway } from './dm.gateway';
import { DmController } from './dm.controller';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@Module({
  controllers: [DmController],
  providers: [DmGateway, DmService, WsAuthGuard],
})
export class DmModule {}

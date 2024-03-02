import { Inject, UseGuards, forwardRef } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'engine.io';
import { Socket } from 'socket.io';
import { WsAuthGuard, authenticateSocket } from 'src/auth/ws-auth.guard';
import { GamesService } from 'src/games/games.service';
import {
  USER_STATUS,
  UserStatusType,
  UsersStatusEmitsDto,
} from 'src/types/usersStatusTypes';
import { UsersStatusService } from './UsersStatusService';

@WebSocketGateway(5050, {
  namespace: 'status',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsAuthGuard)
export class UsersStatusGateway {
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<number, UserStatusType>();

  constructor(
    private readonly wsGuard: WsAuthGuard,
    private readonly usersStatusService: UsersStatusService,
  ) {}

  afterInit(client: Socket) {
    authenticateSocket(client, this.wsGuard);
  }

  async handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    const user = this.onlineUsers.get(userId);

    if (!user) {
      let status: USER_STATUS = USER_STATUS.ONLINE;
      try {
        if (await this.usersStatusService.isUserPlaying(userId)) {
          status = USER_STATUS.PLAYING;
        }
      } catch (error) {
        console.log(error);
      }

      const userInfo = {
        status,
        connectionsCount: 1,
      };
      this.onlineUsers.set(userId, userInfo);
      this.sendToAll('status', { userId, status });
    } else {
      user.connectionsCount++;
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.extractUserId(client);
    this.setUserAsOffline(userId);
  }

  setUserAsOnline(userId: number) {
    const user = this.onlineUsers.get(userId);
    if (!user) {
      const userInfo = {
        status: USER_STATUS.ONLINE,
        connectionsCount: 1,
      };
      this.onlineUsers.set(userId, userInfo);
    } else if (user.status !== USER_STATUS.ONLINE) {
      user.status = USER_STATUS.ONLINE;
    }
    this.sendToAll('status', { userId, status: USER_STATUS.ONLINE });
  }

  setUserAsOffline(userId: number) {
    const user = this.onlineUsers.get(userId);
    if (!user) return;

    user.connectionsCount--;
    if (user.connectionsCount <= 0) {
      this.onlineUsers.delete(userId);
      this.sendToAll('status', { userId, status: USER_STATUS.OFFLINE });
    }
  }

  setUserAsPlaying(userId: number) {
    const user = this.onlineUsers.get(userId);
    if (!user) {
      this.onlineUsers.set(userId, {
        status: USER_STATUS.PLAYING,
        connectionsCount: 1,
      });
    } else {
      user.status = USER_STATUS.PLAYING;
    }
    this.sendToAll('status', { userId, status: USER_STATUS.PLAYING });
  }

  getUserStatus(userId: number) {
    const user = this.onlineUsers.get(userId);
    if (!user) {
      return USER_STATUS.OFFLINE;
    }
    return user.status;
  }

  isOnline(userId: number) {
    return this.onlineUsers.has(userId);
  }

  private extractUserId(client: Socket): number {
    return client.data.id;
  }

  sendToAll<T extends string>(ev: T, data: UsersStatusEmitsDto<T>) {
    this.server.emit(ev, data);
  }
}

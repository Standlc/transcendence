import { UseGuards } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'engine.io';
import { Socket } from 'socket.io';
import { WsAuthGuard, authenticateSocket } from 'src/auth/ws-auth.guard';
import {
  USER_STATUS,
  UserStatusType,
  UsersStatusEmitsDto,
} from 'src/types/usersStatusTypes';

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

  constructor(private readonly wsGuard: WsAuthGuard) {}

  afterInit(client: Socket) {
    authenticateSocket(client, this.wsGuard);
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    const user = this.onlineUsers.get(userId);

    if (!user) {
      const userInfo = {
        status: USER_STATUS.ONLINE,
        connectionsCount: 1,
      };
      this.onlineUsers.set(userId, userInfo);
      this.sendToAll('status', { userId, status: USER_STATUS.ONLINE });
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

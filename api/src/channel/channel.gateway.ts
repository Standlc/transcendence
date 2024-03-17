import { SocketService } from './socketService.service';
import { ConnectedUsersService } from './../connectedUsers/connectedUsers.service';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  ActionOnUser,
  ChannelAndUserIdPayload,
  ChannelServerEmitTypes,
  ChannelServerEventTypes,
  ConnectToChannel,
  MuteUser,
} from 'src/types/channelsSchema';
import { Injectable, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { Utils } from './utilsChannel.service';

@WebSocketGateway(5050, {
  namespace: '/channel',
  cors: {
    origin: '*',
  },
})
@Injectable()
@UseGuards(WsAuthGuard)
export class ChannelGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly wsGuard: WsAuthGuard,
    private readonly connectedUsersService: ConnectedUsersService,
    private readonly utilsChannelService: Utils,
    private readonly socketService: SocketService,
  ) {}

  @WebSocketServer() server: Server;

  afterInit(socket: Socket) {
    socket.use((client, next) => {
      try {
        const payload: { id: number } = this.wsGuard.validateToken(
          client as any,
        );
        (client as any as Socket).data = payload;
        next();
      } catch (error) {
        console.error(error);
        next(new Error('not authorized'));
      }
    });
  }

  handleConnection(socket: Socket) {
    const userId = this.extractUserId(socket);
    socket.join(btoa(userId.toString()));
    console.log(`Client connected: ${socket.id}`);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    const userId = this.extractUserId(socket);
    socket.leave(btoa(userId.toString()));
  }

  /**
   * Handle 'real-time' events (kick, ban, mute, etc)
   */

  emitNewChannel(channelId: number, membersId: number[]) {
    membersId.forEach((id) => {
      this.server
        .to(btoa(id.toString()))
        .emit(
          'newChannel',
          channelId satisfies ChannelServerEmitTypes['newChannel'],
        );
    });
  }

  emitUserJoined(payload: ChannelAndUserIdPayload) {
    this.server
      .to(payload.channelId.toString())
      .emit(
        'memberJoin',
        payload satisfies ChannelServerEmitTypes['memberJoin'],
      );
  }

  emitUserLeave(payload: ChannelAndUserIdPayload) {
    this.server
      .to(payload.channelId.toString())
      .emit(
        'memberLeave',
        payload satisfies ChannelServerEmitTypes['memberLeave'],
      );

    this.server
      .in(btoa(String(payload.userId)))
      .socketsLeave(String(payload.channelId));
  }

  emitChannelDelete(channelId: number, membersId: number[]) {
    membersId.forEach((id) => {
      this.server
        .to(btoa(id.toString()))
        .emit(
          'channelDelete',
          channelId satisfies ChannelServerEmitTypes['channelDelete'],
        );
    });
    this.server.socketsLeave(String(channelId));
  }

  emitNewAdmin(payload: ChannelAndUserIdPayload) {
    this.server
      .to(payload.channelId.toString())
      .emit('newAdmin', payload satisfies ChannelServerEmitTypes['newAdmin']);
  }

  emitAdminRemove(payload: ChannelAndUserIdPayload) {
    this.server
      .to(payload.channelId.toString())
      .emit(
        'adminRemove',
        payload satisfies ChannelServerEmitTypes['adminRemove'],
      );
  }

  emitChannelUpdated(channelId: number, membersId: number[]) {
    membersId.forEach((id) => {
      this.server
        .to(btoa(id.toString()))
        .emit(
          'channelUpdated',
          channelId satisfies ChannelServerEmitTypes['channelUpdated'],
        );
    });
  }

  //
  //
  //
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    const userId = this.extractUserId(socket);
    const isUserAMember = await this.utilsChannelService.isChannelMember(
      userId,
      payload.channelId,
    );
    if (isUserAMember) {
      socket.join(String(payload.channelId));
    }
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    socket.leave(String(payload.channelId));
  }

  @SubscribeMessage('createChannelMessage')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ChannelServerEventTypes['createChannelMessage'],
  ) {
    const senderId = socket.data.id;
    try {
      const message: ChannelServerEmitTypes['createChannelMessage'] =
        await this.socketService.createMessage(
          payload.channelId,
          payload.content,
          senderId,
        );
      this.server
        .to(String(payload.channelId))
        .emit('createChannelMessage', message);
    } catch (error) {}
  }

  @SubscribeMessage('banUser')
  async handleBanUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    const userId = this.extractUserId(socket);

    try {
      await this.socketService.banUser(
        userId,
        payload.channelId,
        payload.targetUserId,
      );
    } catch (error) {}

    try {
      const emitPayload: ChannelServerEmitTypes['memberBanned'] = {
        userId,
        channelId: payload.channelId,
      };
      this.server
        .to(payload.channelId.toString())
        .emit('memberBanned', emitPayload);

      const bannedUserSockets = await this.server.sockets
        .in(btoa(String(userId)))
        .fetchSockets();

      bannedUserSockets.forEach((s) => s.leave(payload.channelId.toString()));
    } catch (error) {}
  }

  @SubscribeMessage('kickUser')
  async handleKickUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    // try {
    //   this.connectedUsersService.verifyConnection(socket);
    // } catch (error) {
    //   console.error(error);
    //   throw new WsException('User did not join channel room');
    // }

    const userId = socket.data.id;

    try {
      await this.socketService.kickUser(
        userId,
        payload.channelId,
        payload.targetUserId,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not kick user');
    }

    try {
      const kickedSocketId = this.connectedUsersService.getSocket(
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been kicked`,
      );

      if (kickedSocketId) {
        kickedSocketId.leave(payload.channelId.toString());
        this.connectedUsersService.removeUserWithSocketId(
          kickedSocketId.id as string,
        );
      }
    } catch (error) {
      console.error(error);
      throw new WsException('Could not leave channel');
    }
  }

  //
  //
  //
  @SubscribeMessage('muteUser')
  async handleMuteUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MuteUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.muteUser(userId, payload);

      if (payload.muteEnd == null)
        this.sendConfirmation(
          socket,
          payload.channelId,
          `User ${payload.targetUserId} has been muted for 5 minutes`,
        );
      else {
        this.sendConfirmation(
          socket,
          payload.channelId,
          `User ${payload.targetUserId} has been muted until ${payload.muteEnd}`,
        );
      }
    } catch (error) {
      console.error(error);
      throw new WsException('Could not mute user');
    }
  }

  //
  //
  //
  @SubscribeMessage('addChannelAdmin')
  async handleAddChannelAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.addAdministrator(
        userId,
        payload.channelId,
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been promoted to admin`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not add admin');
    }
  }

  //
  //
  //
  @SubscribeMessage('removeChannelAdmin')
  async handleRemoveChannelAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.removeAdministrator(
        userId,
        payload.channelId,
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been demoted from admin`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not remove admin');
    }
  }

  //
  //
  //
  sendConfirmation(socket: Socket, channelId: number, message: string) {
    if (socket.rooms.has(channelId.toString())) {
      this.server.to(channelId.toString()).emit('message', message);
    }
  }

  extractUserId(socket: Socket) {
    return socket.data.id as number;
  }
}

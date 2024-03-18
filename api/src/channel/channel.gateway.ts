import { SocketService } from './socketService.service';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  ChannelAndUserIdPayload,
  ChannelServerEmitTypes,
  ChannelServerEventTypes,
  ConnectToChannel,
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
    const userRoom = btoa(payload.userId.toString());

    this.server
      .to(payload.channelId.toString())
      .to(userRoom)
      .emit(
        'memberJoin',
        payload satisfies ChannelServerEmitTypes['memberJoin'],
      );
  }

  emitUserLeave(payload: ChannelAndUserIdPayload) {
    const userRoom = btoa(payload.userId.toString());

    this.server
      .to(payload.channelId.toString())
      .to(userRoom)
      .emit(
        'memberLeave',
        payload satisfies ChannelServerEmitTypes['memberLeave'],
      );

    this.server.in(userRoom).socketsLeave(payload.channelId.toString());
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

  emitMemberMuted(payload: ChannelAndUserIdPayload) {
    this.server
      .to(payload.channelId.toString())
      .emit(
        'memberMuted',
        payload satisfies ChannelServerEmitTypes['memberMuted'],
      );
  }

  emitUserBanned(payload: ChannelAndUserIdPayload) {
    const userRoom = btoa(payload.userId.toString());

    this.server
      .to(payload.channelId.toString())
      .to(userRoom)
      .emit(
        'userBanned',
        payload satisfies ChannelServerEmitTypes['userBanned'],
      );

    this.server.in(userRoom).socketsLeave(payload.channelId.toString());
  }

  emitUserUnbanned(payload: ChannelAndUserIdPayload) {
    this.server
      .to(payload.channelId.toString())
      .emit(
        'userUnbanned',
        payload satisfies ChannelServerEmitTypes['userUnbanned'],
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

  extractUserId(socket: Socket) {
    return socket.data.id as number;
  }
}

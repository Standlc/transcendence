import { UseGuards } from '@nestjs/common';
import { DmService } from './dm.service';
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
import { ConnectToDm, DirectMessageContent } from 'src/types/channelsSchema';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { ConnectedUsersService } from 'src/connectedUsers/connectedUsers.service';

@WebSocketGateway(5050, {
  namespace: 'dm',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsAuthGuard)
export class DmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private dmService: DmService,
    private readonly wsGuard: WsAuthGuard,
    private readonly connectedUsersService: ConnectedUsersService,
  ) {}

  @WebSocketServer() server: Server;

  //
  //
  //
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

  //
  //
  //
  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  //
  //
  //
  handleDisconnect(socket: Socket) {
    try {
      socket.disconnect();
      console.log('Client disconnected');
    } catch (error) {
      console.error('Error disconnecting client:', error);
      throw new WsException('Error disconnecting client');
    }
  }

  //
  //
  //
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToDm,
  ) {
    try {
      await this.dmService.userExists(payload.userId);
    } catch (error) {
      console.error(error);

      throw new WsException('User not found');
    }

    try {
      await this.dmService.conversationExists(payload.conversationId);
    } catch (error) {
      console.error(error);
      throw new WsException('Conversation not found');
    }

    try {
      socket.join(payload.conversationId.toString());
      console.log(
        `User ${payload.userId} joined conversation ${payload.conversationId}`,
      );

      if (socket.rooms.has(payload.conversationId.toString())) {
        this.server
          .to(payload.conversationId.toString())
          .emit('message', 'User joined conversation');
      }
      this.connectedUsersService.addUser(payload.userId, socket);
    } catch (error) {
      console.error(error);
      throw new WsException('Unable to join conversation');
    }
  }

  //
  //
  //
  @SubscribeMessage('leaveConversation')
  async leaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToDm,
  ) {
    try {
      if (socket.rooms.has(payload.conversationId.toString())) {
        this.server
          .to(payload.conversationId.toString())
          .emit('message', 'User left conversation');
      }
      socket.leave(payload.conversationId.toString());
      console.log(
        `User ${payload.userId} left conversation ${payload.conversationId}`,
      );

      this.connectedUsersService.removeUserWithSocketId(socket.id);
    } catch (error) {
      console.error(error);
      socket.disconnect();
      throw new WsException('Unable to leave conversation');
    }
  }

  //
  //
  //
  @SubscribeMessage('createDirectMessage')
  create(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: DirectMessageContent,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    try {
      if (socket.rooms.has(payload.conversationId.toString())) {
        this.dmService.createDirectMessage(payload);
        this.server
          .to(payload.conversationId.toString())
          .emit('createDirectMessage', payload);
      }
    } catch (error) {
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new WsException('Cannot send message');
    }
  }
}

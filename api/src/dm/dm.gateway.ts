import { UseGuards, Request } from '@nestjs/common';
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
import { DirectMessageContent } from 'src/types/channelsSchema';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { ConnectedUsersService } from 'src/connectedUsers/connectedUsers.service';

@WebSocketGateway(5050, {
  namespace: 'socket.io/dm',
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
    @MessageBody() payload: { conversationId: number },
  ) {
    const userId = socket.data.id;

    try {
      await this.dmService.conversationExists(payload.conversationId);
    } catch (error) {
      console.error(error);
      throw new WsException('Conversation not found');
    }

    try {
      socket.join(payload.conversationId.toString());
      console.log(
        `User ${userId} joined conversation ${payload.conversationId}`,
      );

      if (socket.rooms.has(payload.conversationId.toString())) {
        this.server
          .to(payload.conversationId.toString())
          .emit(
            'message',
            `User ${userId} joined conversation ${payload.conversationId}`,
          );
      }
      this.connectedUsersService.addUser(userId, socket);
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
    @MessageBody() payload: { conversationId: number },
  ) {
    const userId = socket.data.id;

    try {
      if (socket.rooms.has(payload.conversationId.toString())) {
        this.server
          .to(payload.conversationId.toString())
          .emit(
            'message',
            `User ${userId} left conversation ${payload.conversationId}`,
          );
      }
      socket.leave(payload.conversationId.toString());
      console.log(`User ${userId} left conversation ${payload.conversationId}`);

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
      const senderId = socket.data.id;

      if (socket.rooms.has(payload.conversationId.toString())) {
        this.dmService.createDirectMessage(payload, senderId);
        this.server
          .to(payload.conversationId.toString())
          .emit('createDirectMessage', {
            senderId: senderId,
            content: payload.content,
            conversationId: payload.conversationId,
          });
      }
    } catch (error) {
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new WsException('Cannot send message');
    }
  }

  //
  //
  //
  // !!! to test
  @SubscribeMessage('getDirectMessages')
  async getDirectMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { conversationId: number },
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    try {
      const userId = socket.data.id;
      const messages = await this.dmService.getConversationMessages(
        payload.conversationId,
        userId,
      );
      socket.emit('getDirectMessages', messages);
    } catch (error) {
      console.error(error);
      throw new WsException('Cannot get messages');
    }
  }
}

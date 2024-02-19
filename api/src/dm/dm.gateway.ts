import {
  InternalServerErrorException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { DmService } from './dm.service';
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
import { ConnectToDm, DirectMessageContent } from 'src/types/channelsSchema';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@WebSocketGateway({
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

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    try {
      socket.disconnect();
      console.log('Client disconnected');
    } catch (error) {
      console.error('Error disconnecting client:', error);
    }
  }

  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToDm,
  ) {
    try {
      console.log('Payload:', payload);
      await this.dmService.userExists(payload.userId);
    } catch (error) {
      socket.disconnect();
      throw error;
    }

    try {
      await this.dmService.conversationExists(payload.conversationId);
    } catch (error) {
      throw error;
    }

    try {
      socket.join(payload.conversationId.toString());
      console.log(
        `User ${payload.userId} joined conversation ${payload.conversationId}`,
      );
    } catch (error) {
      socket.disconnect();
      throw new UnprocessableEntityException('Unable to join conversation');
    }
  }

  @SubscribeMessage('leaveConversation')
  async leaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToDm,
  ) {
    try {
      socket.leave(payload.conversationId.toString());
      console.log(
        `User ${payload.userId} left conversation ${payload.conversationId}`,
      );
    } catch (error) {
      console.error(error);
      socket.disconnect();
      throw new UnprocessableEntityException('Unable to leave conversation');
    }
  }

  // !!! to test more later
  @SubscribeMessage('quitConversation')
  async quitChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToDm,
  ) {
    try {
      socket.leave(payload.conversationId.toString());
      this.dmService.quitConversation(payload); // delete the user, or the conversation
      console.log(
        `User ${payload.userId} quit conversation ${payload.conversationId}`,
      );
    } catch (error) {
      console.error(error);
      socket.disconnect();
      throw new UnprocessableEntityException('Unable to quit conversation');
    }
  }

  @SubscribeMessage('createDirectMessage')
  create(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: DirectMessageContent,
  ) {
    try {
      if (socket.rooms.has(payload.conversationId.toString())) {
        this.dmService.createDirectMessage(payload);
        this.server
          .to(payload.conversationId.toString())
          .emit('createDirectMessage', payload);
      }
    } catch (error) {
      console.error(error);
      if (error instanceof InternalServerErrorException) throw error;
      throw new UnprocessableEntityException('Cannot send message');
    }
  }
}

import {
  NotFoundException,
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
import { DirectMessageContent, SocketAntiSpam } from 'src/types/channelsSchema';
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

  // !!! TODO = need to find a way to extract userId, like the @Request in http?
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

    // !!! to test later
    // try {
    //   socket.requestCount = 0;
    //   // Checks the request connection count every second, limit = 100
    //   setInterval(() => {
    //     if (socket.requestCount && socket.requestCount > 100) {
    //       console.error('Rate limit exceeded: socket disconnected');
    //       socket.disconnect();
    //     } else {
    //       socket.requestCount = 0;
    //     }
    //   }, 1000);
    // } catch (error) {
    //   console.error(error);
    // }
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
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    try {
      await this.dmService.userExists(data.userId);
    } catch (error) {
      socket.disconnect();
      throw new NotFoundException('User not found');
    }

    try {
      await this.dmService.conversationExists(data.conversationId);
    } catch (error) {
      socket.disconnect();
      throw new NotFoundException('Conversation not found');
    }

    try {
      socket.join(data.conversationId.toString());
      console.log(
        `User ${data.userId} joined conversation ${data.conversationId}`,
      );
    } catch (error) {
      socket.disconnect();
      throw new UnprocessableEntityException('Unable to join conversation');
    }
  }

  @SubscribeMessage('leaveConversation')
  async leaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    try {
      socket.leave(data.conversationId.toString());
      console.log(
        `User ${data.userId} left conversation ${data.conversationId}`,
      );
    } catch (error) {
      console.error(error);
      socket.disconnect();
      throw new UnprocessableEntityException('Unable to leave conversation');
    }
  }

  @SubscribeMessage('createDirectMessage')
  create(socket: Socket, @MessageBody() directMessage: DirectMessageContent) {
    try {
      if (socket.rooms.has(directMessage.conversationId.toString())) {
        this.dmService.createDirectMessage(directMessage);
        this.server
          .to(directMessage.conversationId.toString())
          .emit('createDirectMessage', directMessage);
      }
    } catch (error) {
      console.error(error);
      throw new UnprocessableEntityException('Cannot send message');
    }
  }

  /*// >>> in http requests
  @SubscribeMessage('findAllDirectMessages')
  findAll(
    @MessageBody() data: { conversationId: number },
  ): Promise<DirectMessage[]> {
    return this.dmService.findAllDirectMessages(data.conversationId);
  }

  // >>> not needed
  @SubscribeMessage('findDirectMessage')
  findOne(@MessageBody() id: number) {
    return this.dmService.findDirectMessage(id);
  }

  // >>> not needed
  @SubscribeMessage('updateDirectMessage')
  update(@MessageBody() directMessage: DirectMessage) {
    return this.dmService.updateDirectMessage(
      Number(directMessage.id),
      directMessage,
    );
  }

  // >>> not needed
  @SubscribeMessage('removeDirectMessage')
  remove(@MessageBody() id: number) {
    return this.dmService.removeDirectMessage(id);
  }*/
}

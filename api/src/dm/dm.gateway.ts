import { Inject, UseGuards, forwardRef } from '@nestjs/common';
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
import { DmGatewayEmitTypes } from 'src/types/conversations';

@WebSocketGateway(5050, {
  namespace: 'dm',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsAuthGuard)
export class DmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => DmService))
    private dmService: DmService,
    private readonly wsGuard: WsAuthGuard,
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
    const userId = this.extractUserId(socket);
    socket.join(btoa(String(userId)));
  }

  //
  //
  //
  handleDisconnect(socket: Socket) {
    const userId = this.extractUserId(socket);
    socket.leave(btoa(String(userId)));
  }

  //
  //
  //
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { conversationId: number },
  ) {
    try {
      await this.dmService.conversationExists(payload.conversationId);
    } catch (error) {
      console.error(error);
      throw new WsException('Conversation not found');
    }

    socket.join(payload.conversationId.toString());
  }

  //
  //
  //
  @SubscribeMessage('leaveConversation')
  async leaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { conversationId: number },
  ) {
    socket.leave(payload.conversationId.toString());
  }

  //
  //
  //
  @SubscribeMessage('createDirectMessage')
  async createDirectMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: DirectMessageContent,
  ) {
    try {
      const senderId = this.extractUserId(socket);
      const canSendMessage = await this.dmService.canUserSendMessage(
        senderId,
        payload.conversationId,
      );
      if (!canSendMessage) {
        throw new WsException('Not allowed');
      }

      const newMessage = await this.dmService.createDirectMessage(
        payload,
        senderId,
      );
      this.server
        .to(payload.conversationId.toString())
        .emit('createDirectMessage', newMessage);
    } catch (error) {
      console.error(error);
      throw new WsException('Cannot send message');
    }
  }

  emitNewConversation(membersIds: number[], conversationId: number) {
    membersIds.forEach((id) => {
      this.server
        .to(btoa(id.toString()))
        .emit(
          'newConversation',
          conversationId satisfies DmGatewayEmitTypes['newConversation'],
        );
    });
  }

  emitConversationDeleted(membersIds: number[], conversationId: number) {
    membersIds.forEach((id) => {
      this.server
        .to(btoa(id.toString()))
        .emit(
          'conversationDeleted',
          conversationId satisfies DmGatewayEmitTypes['conversationDeleted'],
        );
    });
  }

  extractUserId(socket: Socket) {
    return socket.data.id as number;
  }
}

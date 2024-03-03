import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
@WebSocketGateway(5050, {
  namespace: 'socket.io/liveChatSocket',
})
@UseGuards(WsAuthGuard)
export class LiveChatSocket
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly wsGuard: WsAuthGuard) {}

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
      throw new WsException('Error disconnecting client');
    }
  }

  // !!! to finish
  handleNewConversation(conversation: {
    id: number;
    user1: number;
    user2: number;
  }) {
    this.server.emit('newConversation', conversation);
  }

  // !!! to finish
  handleDeleteConversation(conversationId: number) {
    this.server.emit('deleteConversation', conversationId);
  }
}

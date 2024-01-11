import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongGuard } from './pong.guard';

interface DataType {
  position: (payload: string) => void;
}

@UseGuards(PongGuard)
@WebSocketGateway()
export class PongGateway {
  @WebSocketServer()
  server: Server<any, DataType>;

  afterInit(client: Socket) {
    client.use((req, next) => {});
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('newMessage')
  handleNewMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    this.server.emit('position', 'hello');
  }
}

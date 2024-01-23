import { ChatService } from './chat.service';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelMessage } from 'src/types/schema';
import { parse } from 'url';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private chatService: ChatService) {}

  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    try {
      const url = parse(client.handshake.url, true);
      const { query } = url;
      const id = query.id as string; // Extracting dynamic parameters from the URL
      const channelId = query.channelId as string;

      client.join(channelId.toString());
      this.chatService
        .addClient(Number(channelId), Number(id))
        .catch((error) => {
          console.error('Error adding user to database:', error);
        });
      this.chatService.addChannel(Number(channelId)).catch((error) => {
        console.error('Error adding channel to database:', error);
      });

      console.log(
        `Client connected: ${client.id}, id: ${id}, channelId: ${channelId}`,
      );
    } catch (error) {
      console.error('Error handling connection:', error);
    }
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: ChannelMessage): void {
    try {
      const url = parse(client.handshake.url, true);
      const { query } = url;
      const id = query.id as string;
      const channelId = query.channelId as string;

      payload.senderId = Number(id);
      payload.channelId = Number(channelId);

      console.log(`Received message from ${client.id}:`);
      console.log('Content:', payload.content);
      console.log('SenderId:', payload.senderId);
      console.log('ChannelId:', payload.channelId);
      console.log('id:', payload.id);
      console.log('createdAt:', payload.createdAt);

      this.chatService.createMessage(payload);
      this.server
        .to(channelId)
        .emit('message', `Server says: ${JSON.stringify(payload)}`);
    } catch (error) {
      console.error('Error emitting message:', error);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const id = this.chatService.getStoredId();
      if (!isNaN(id)) {
        this.chatService.removeClient(id).catch((error) => {
          console.error('Error removing ChannelMember from database:', error);
        });
      }
      client.leave(this.chatService.getStoredChannelId().toString());
      client.disconnect(true);
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }
}

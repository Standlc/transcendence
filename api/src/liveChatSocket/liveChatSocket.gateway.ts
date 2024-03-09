import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InternalServerErrorException, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { db } from 'src/database';
import { ConnectedUsersService } from 'src/connectedUsers/connectedUsers.service';
@WebSocketGateway(5050, {
  namespace: 'socket.io/liveChatSocket',
})
@UseGuards(WsAuthGuard)
export class LiveChatSocket
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
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
    socket.join(socket.data.id.toString());
    console.log('CONNECTION: ', socket.data.id.toString());
  }

  //
  //
  //
  handleDisconnect(socket: Socket) {
    socket.leave(socket.data.id.toString());
    // try {
    //   socket.disconnect();
    //   console.log('Client disconnected');
    // } catch (error) {
    //   console.error('Error disconnecting client:', error);
    //   throw new WsException('Error disconnecting client');
    // }
  }

  //
  //
  //
  // !!! to finish
  @SubscribeMessage('joinChatSocket')
  async joinChatSocket(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { userId: number },
  ) {
    try {
      this.connectedUsersService.addUser(payload.userId, socket);
      socket.join(payload.userId.toString());

      if (socket.rooms.has(payload.userId.toString())) {
        this.server
          .to(payload.userId.toString())
          .emit('message', 'User joined conversation');
      } else {
        console.log('User not joined chat socket');
      }

      // !!! testing function
      console.log(payload.userId);
      // this.connectedUsersService.getSocket(payload.userId);
      // console.log('Socket:', socket);

      console.log(`User ${payload.userId} joined chat socket`);
    } catch (error) {
      console.error('Error joining chat socket:', error);
      throw new WsException('Error joining chat socket');
    }
  }

  //
  //
  //
  // !!! to finish
  @SubscribeMessage('leaveChatSocket')
  async handleNewConversation(sender: number, targetUser: number) {
    try {
      const dmInfo = await db
        .selectFrom('conversation')
        .selectAll()
        .where((eb) =>
          eb.or([eb('user1_id', '=', sender), eb('user2_id', '=', sender)]),
        )
        .where((eb) =>
          eb.or([
            eb('user1_id', '=', targetUser),
            eb('user2_id', '=', targetUser),
          ]),
        )
        .executeTakeFirstOrThrow();

      console.log('targetUser:', targetUser);
      this.connectedUsersService.getAllConnectedUsers();
      const socket = this.connectedUsersService.getSocket(targetUser);
      console.log('Socket:', socket);

      if (socket && socket.rooms.has(targetUser.toString())) {
        // this.server.to(targetUser.toString()).emit('newConversation', dmInfo);
        this.server.to(targetUser.toString()).emit('newConversation', dmInfo);
      } else {
        console.log('User not joined chat socket');
      }
      // this.server.to(targetUser.toString()).emit('newConversation', dmInfo);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! to finish
  handleDeleteConversation(conversationId: number) {
    this.server.emit('deleteConversation', conversationId);
  }
}

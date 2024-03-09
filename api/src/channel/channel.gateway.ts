import { SocketService } from './socketService.service';
import { ConnectedUsersService } from './../connectedUsers/connectedUsers.service';
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
import {
  ActionOnUser,
  ChannelMessageContent,
  ConnectToChannel,
  MuteUser,
} from 'src/types/channelsSchema';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { Utils } from './utilsChannel.service';
import { db } from 'src/database';
import { ChannelService } from './channel.service';

@WebSocketGateway(5050, {
  namespace: 'socket.io/channel',
})
@UseGuards(WsAuthGuard)
export class ChannelGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly wsGuard: WsAuthGuard,
    private readonly connectedUsersService: ConnectedUsersService,
    private readonly utilsChannelService: Utils,
    private readonly socketService: SocketService,
    private readonly channelService: ChannelService,
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
  handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  //
  //
  //
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    const userId = socket.data.id;

    try {
      await this.utilsChannelService.channelExists(payload.channelId);
    } catch (error) {
      console.error(error);
      throw new WsException('Channel do not exist');
    }

    try {
      await this.utilsChannelService.userIsBanned(userId, payload.channelId);
    } catch (error) {
      console.error(error);
      throw new WsException('User is banned');
    }

    try {
      const channelInfo = await db
        .selectFrom('channel')
        .select(['channelOwner', 'isPublic'])
        .where('id', '=', payload.channelId)
        .executeTakeFirstOrThrow();
      if (
        userId !== channelInfo.channelOwner &&
        channelInfo.isPublic == false
      ) {
        await this.socketService.isInInviteList(userId, payload.channelId);
      }
    } catch (error) {
      console.error(error);
      throw new WsException('User is not invited to join the channel');
    }

    try {
      await this.socketService.verifyPassword(
        payload.channelId,
        payload.password,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Invalid password');
    }

    try {
      try {
        this.socketService.joinChannel(userId, payload.channelId);
      } catch (error) {
        console.error(error);
        throw new WsException('Could not join channel');
      }

      socket.join(String(payload.channelId));
      this.connectedUsersService.addUser(userId, socket);
      console.log(
        `Client socket ${socket.id}, joined channel: ${payload.channelId}`,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${userId} joined the channel`,
      );
    } catch (error) {
      console.error(error);
      this.connectedUsersService.removeUserWithUserId(userId);
      throw new WsException('Could not join channel');
    }
  }

  //
  //
  //
  @SubscribeMessage('createChannelMessage')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ChannelMessageContent,
  ): Promise<void> {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const senderId = socket.data.id;

    try {
      await this.utilsChannelService.userIsBanned(senderId, payload.channelId);
    } catch (error) {
      socket.leave(String(payload.channelId));
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new WsException(`User is banned from channel ${payload.channelId}`);
    }

    // Do not disconnect the muted user, just don't send the message
    try {
      await this.utilsChannelService.userIsMuted(senderId, payload.channelId);
    } catch (error) {
      console.error(error);
      throw new WsException('User is muted');
    }

    try {
      this.server.to(String(payload.channelId)).emit('createChannelMessage', {
        content: payload.content,
        channelId: payload.channelId,
        senderId: senderId,
      });
    } catch (error) {
      socket.disconnect();
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new WsException('Could not send message');
    }

    try {
      this.socketService.createMessage(
        payload.channelId,
        payload.content,
        senderId,
      );
    } catch (error) {
      socket.leave(String(payload.channelId));
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new WsException('Internal server error');
    }
  }

  //
  //
  //
  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.utilsChannelService.userExists(userId);
      await this.utilsChannelService.channelExists(payload.channelId);
    } catch (error) {
      socket.disconnect();
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new WsException('User or channel does not exist');
    }

    if (!payload.channelId) {
      console.error('No channel id provided');
      throw new WsException('No channel id provided');
    }

    try {
      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${userId} left the channel`,
      );

      socket.leave(String(payload.channelId));
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.log(
        `Client socket ${socket.id}, left channel: ${payload.channelId}`,
      );
    } catch (error) {
      socket.disconnect();
      console.error(error);
      throw new WsException('Could not leave channel');
    }
  }

  //
  //
  //
  @SubscribeMessage('quitChannel')
  async handleQuitChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { channelId: number },
  ): Promise<void> {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.utilsChannelService.userExists(userId);
      await this.utilsChannelService.channelExists(payload.channelId);
    } catch (error) {
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new WsException('User or channel does not exist');
    }

    try {
      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${userId} quit the channel`,
      );

      this.socketService.quitChannel(userId, payload.channelId);
      socket.leave(String(payload.channelId));
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.log(
        `Client socket ${socket.id}, quit channel: ${payload.channelId}`,
      );
    } catch (error) {
      socket.disconnect();
      console.error(error);
      throw new WsException('Could not quit channel');
    }
  }

  //
  //
  //
  handleDisconnect(@ConnectedSocket() socket: Socket) {
    try {
      socket.disconnect();
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.log('Client disconnected');
    } catch (error) {
      console.error(error);
      throw new WsException('Could not disconnect');
    }
  }

  //
  //
  //
  @SubscribeMessage('banUser')
  async handleBanUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.banUser(
        userId,
        payload.channelId,
        payload.targetUserId,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not ban user');
    }

    try {
      const bannedSocketId = this.connectedUsersService.getSocket(
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been banned`,
      );

      if (bannedSocketId) {
        bannedSocketId.leave(payload.channelId.toString());
        this.connectedUsersService.removeUserWithSocketId(
          bannedSocketId.id as string,
        );
      }
    } catch (error) {
      console.error(error);
      throw new WsException('Could not leave channel');
    }
  }

  //
  //
  //
  @SubscribeMessage('unbanUser')
  async handleUnbanUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.unbanUser(
        userId,
        payload.channelId,
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been unbanned`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not unban user');
    }
  }

  //
  //
  //
  @SubscribeMessage('kickUser')
  async handleKickUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      // verifie si le user est admin du channel et
      // et si le targetuser n'est pas owner du channel
      // et si adminId != TargetId
      await this.socketService.kickUser(
        userId,
        payload.channelId,
        payload.targetUserId,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not kick user');
    }

    try {
      const kickedSocketId = this.connectedUsersService.getSocket(
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been kicked`,
      );

      if (kickedSocketId) {
        kickedSocketId.leave(payload.channelId.toString());
        this.connectedUsersService.removeUserWithSocketId(
          kickedSocketId.id as string,
        );
      }
    } catch (error) {
      console.error(error);
      throw new WsException('Could not leave channel');
    }
  }

  //
  //
  //
  @SubscribeMessage('muteUser')
  async handleMuteUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MuteUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.muteUser(userId, payload);

      if (payload.muteEnd == null)
        this.sendConfirmation(
          socket,
          payload.channelId,
          `User ${payload.targetUserId} has been muted for 5 minutes`,
        );
      else {
        this.sendConfirmation(
          socket,
          payload.channelId,
          `User ${payload.targetUserId} has been muted until ${payload.muteEnd}`,
        );
      }
    } catch (error) {
      console.error(error);
      throw new WsException('Could not mute user');
    }
  }

  //
  //
  //
  @SubscribeMessage('unmuteUser')
  async handleUnmute(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.unmuteUser(userId, payload);

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been unmuted`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not unmute user');
    }
  }

  //
  //
  //
  //blocked user can still send messages but the user who blocked cannot see them
  //blocked works for all the channels
  @SubscribeMessage('blockUser')
  async handleBlockUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { targetUserId: number },
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.blockUser(userId, payload.targetUserId);
    } catch (error) {
      console.error(error);
      throw new WsException('Could not block user');
    }
  }

  //
  //
  //
  @SubscribeMessage('unblockUser')
  async hadleUnblockUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { targetUserId: number },
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.unblockUser(userId, payload.targetUserId);
    } catch (error) {
      console.error(error);
      throw new WsException('Could not unblock user');
    }
  }

  //
  //
  //
  @SubscribeMessage('addChannelAdmin')
  async handleAddChannelAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.addAdministrator(
        userId,
        payload.channelId,
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been promoted to admin`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not add admin');
    }
  }

  //
  //
  //
  @SubscribeMessage('removeChannelAdmin')
  async handleRemoveChannelAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.removeAdministrator(
        userId,
        payload.channelId,
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been demoted from admin`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not remove admin');
    }
  }

  //
  //
  //
  @SubscribeMessage('addToInviteList')
  async handleAddToInviteList(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.addToInviteList(
        userId,
        payload.channelId,
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been added to invite list`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not add user to invite list');
    }
  }

  //
  //
  //
  @SubscribeMessage('removeFromInviteList')
  async handleRemoveFromInviteList(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    const userId = socket.data.id;

    try {
      await this.socketService.removeFromInviteList(
        userId,
        payload.channelId,
        payload.targetUserId,
      );

      this.sendConfirmation(
        socket,
        payload.channelId,
        `User ${payload.targetUserId} has been removed from invite list`,
      );
    } catch (error) {
      console.error(error);
      throw new WsException('Could not remove user from invite list');
    }
  }

  //
  //
  //
  @SubscribeMessage('getChannelMessages')
  async handleGetChannelMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { channelId: number },
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      console.error(error);
      throw new WsException('User did not join channel room');
    }

    try {
      const userId = socket.data.id;
      const messages = await this.channelService.getChannelMessages(
        userId,
        payload.channelId,
      );

      socket.emit('getChannelMessages', messages);
    } catch (error) {
      console.error(error);
      throw new WsException('Could not get messages');
    }
  }

  //
  //
  //
  sendConfirmation(socket: Socket, channelId: number, message: string) {
    if (socket.rooms.has(channelId.toString())) {
      this.server.to(channelId.toString()).emit('message', message);
    }
  }
}

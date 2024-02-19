import { ConnectedUsersService } from './connectedUsers/connectedUsers.service';
import { ChannelService } from './channel.service';
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
import {
  ActionOnUser,
  BlockUser,
  ChannelMessageContent,
  ConnectToChannel,
  MuteUser,
} from 'src/types/channelsSchema';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

@WebSocketGateway({
  namespace: 'channel',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsAuthGuard)
export class ChannelGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private channelService: ChannelService,
    private readonly wsGuard: WsAuthGuard,
    private connectedUsersService: ConnectedUsersService,
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
  @SubscribeMessage('joinchannel')
  async handleJoinChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    try {
      await this.channelService.userExists(payload.userId);
    } catch (error) {
      socket.disconnect();
      throw new UnauthorizedException('User do not exist');
    }
    try {
      await this.channelService.channelExists(payload.channelId);
    } catch (error) {
      throw new UnauthorizedException('Channel do not exist');
    }
    try {
      await this.channelService.userIsBanned(payload.userId, payload.channelId);
    } catch (error) {
      throw new UnauthorizedException('User is banned');
    }

    try {
      if (
        payload.userId !== payload.channelOwner &&
        payload.isPublic === false
      ) {
        await this.channelService.usersAreFriends(
          payload.userId,
          payload.channelOwner,
        );
      }
    } catch (error) {
      throw new UnauthorizedException(
        'Users are not friends, impossible to join a private or protected channel',
      );
    }

    try {
      if (payload.password !== null) {
        await this.channelService.verifyPassword(
          payload.channelId,
          payload.password,
        );
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!payload.channelId) {
      throw new BadRequestException('No channel id provided');
    }

    try {
      try {
        this.channelService.joinChannel(payload.userId, payload.channelId);
      } catch (error) {
        throw new UnprocessableEntityException('Could not join channel');
      }
      socket.join(String(payload.channelId));
      this.connectedUsersService.addUser(payload.userId, socket);
      console.log(
        `Client socket ${socket.id}, joined channel: ${payload.channelId}`,
      );
    } catch (error) {
      socket.disconnect();
      this.connectedUsersService.removeUserWithUserId(payload.userId);
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      console.error(error);
      throw error;
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
      throw error;
    }

    try {
      await this.channelService.userIsBanned(
        payload.senderId,
        payload.channelId,
      );
    } catch (error) {
      socket.leave(String(payload.channelId));
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      throw new UnauthorizedException(
        `User is banned from channel ${payload.channelId}`,
      );
    }

    // Do not disconnect the muted user, just don't send the message
    try {
      await this.channelService.userIsMuted(payload);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('User is muted');
    }

    try {
      this.server
        .to(String(payload.channelId))
        .emit('createChannelMessage', payload);
    } catch (error) {
      socket.disconnect();
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new InternalServerErrorException();
    }

    try {
      this.channelService.createMessage(payload);
    } catch (error) {
      socket.leave(String(payload.channelId));
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  @SubscribeMessage('leavechannel')
  async handleLeaveChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }

    try {
      await this.channelService.userExists(payload.userId);
      await this.channelService.channelExists(payload.channelId);
    } catch (error) {
      socket.disconnect();
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      throw new UnauthorizedException('User or channel does not exist');
    }

    if (!payload.channelId) {
      throw new BadRequestException('No channel id provided');
    }

    socket.leave(String(payload.channelId));
    this.connectedUsersService.removeUserWithSocketId(socket.id);
    console.log(
      `Client socket ${socket.id}, left channel: ${payload.channelId}`,
    );
  }

  //
  //
  //
  // !!! to test
  @SubscribeMessage('quitChannel')
  async handleQuitChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }

    try {
      await this.channelService.userExists(payload.userId);
      await this.channelService.channelExists(payload.channelId);
    } catch (error) {
      socket.disconnect();
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      throw new UnauthorizedException('User or channel does not exist');
    }

    if (!payload.channelId) {
      throw new BadRequestException('No channel id provided');
    }

    try {
      this.channelService.quitChannel(payload);
      socket.leave(String(payload.channelId));
      this.connectedUsersService.removeUserWithSocketId(socket.id);
      console.log(
        `Client socket ${socket.id}, quit channel: ${payload.channelId}`,
      );
    } catch (error) {
      socket.disconnect();
      console.error(error);
      throw new InternalServerErrorException();
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
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  // !!! tested with 2 users
  @SubscribeMessage('banUser')
  async handleBanUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }

    this.channelService.banUser(payload);

    const bannedSocketId = this.connectedUsersService.getSocket(
      payload.targetUserId,
    );

    if (bannedSocketId) {
      bannedSocketId.leave(payload.channelId.toString());
      this.connectedUsersService.removeUserWithSocketId(
        bannedSocketId.id as string,
      );
    }
  }

  //
  //
  //
  // !!! tested
  @SubscribeMessage('unbanUser')
  async handleUnbanUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }
    this.channelService.unbanUser(payload);
  }

  //
  //
  //
  // !!! tested with 2 users
  @SubscribeMessage('kickUser')
  async handleKickUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }

    try {
      // verifie si le user est admin du channel et
      // et si le targetuser n'est pas owner du channel
      // et si adminId != TargetId
      await this.channelService.kickUser(payload);
    } catch (error) {
      throw error;
    }
    const kickedSocketId = this.connectedUsersService.getSocket(
      payload.targetUserId,
    );

    if (kickedSocketId) {
      kickedSocketId.leave(payload.channelId.toString());
      this.connectedUsersService.removeUserWithSocketId(
        kickedSocketId.id as string,
      );
    }
  }

  //
  //
  //
  // !!! tested
  @SubscribeMessage('muteUser')
  async handleMuteUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MuteUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }
    this.channelService.muteUser(payload);
  }

  //
  //
  //
  // !!! tested
  @SubscribeMessage('unmuteUser')
  async handleUnmute(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MuteUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }
    this.channelService.unmuteUser(payload);
  }

  //
  //
  //
  // !!! tested
  //blocked user can still send messages but the user who blocked cannot see them
  //blocked works for all the channels
  @SubscribeMessage('blockUser')
  async handleBlockUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: BlockUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }
    this.channelService.blockUser(payload);
  }

  //
  //
  //
  // !!! tested
  @SubscribeMessage('unblockUser')
  async hadleUnblockUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: BlockUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }
    this.channelService.unblockUser(payload);
  }

  //
  //
  //
  // !!! tested
  @SubscribeMessage('addChannelAdmin')
  async handleAddChannelAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }
    this.channelService.addAdministrator(payload);
  }

  //
  //
  //
  // !!! tested
  @SubscribeMessage('removeChannelAdmin')
  async handleRemoveChannelAdmin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActionOnUser,
  ) {
    try {
      this.connectedUsersService.verifyConnection(socket);
    } catch (error) {
      throw error;
    }
    this.channelService.removeAdministrator(payload);
  }
}

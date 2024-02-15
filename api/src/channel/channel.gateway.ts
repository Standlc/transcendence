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
    // !!! test it later
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
    //   throw new InternalServerErrorException();
    // }
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
      console.log(payload.password);
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
      socket.join(String(payload.channelId));
      try {
        this.channelService.joinChannel(payload.userId, payload.channelId);
      } catch (error) {
        socket.disconnect();
        throw new UnprocessableEntityException('Could not join channel');
      }
      console.log(
        `Client socket ${socket.id}, joined channel: ${payload.channelId}`,
      );
    } catch (error) {
      socket.disconnect();
      throw new InternalServerErrorException();
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
      await this.channelService.userIsBanned(
        payload.senderId,
        payload.channelId,
      );
    } catch (error) {
      socket.leave(String(payload.channelId));
      throw new UnauthorizedException('User is banned');
    }

    // Do not disconnect the muted user, just don't send the message
    try {
      await this.channelService.userIsMuted(payload);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('User is muted');
    }

    try {
      this.channelService.createMessage(payload);
    } catch (error) {
      socket.leave(String(payload.channelId));
      console.error(error);
      throw new InternalServerErrorException();
    }

    try {
      this.server
        .to(String(payload.channelId))
        .emit('createChannelMessage', payload);
    } catch (error) {
      socket.disconnect();
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
      await this.channelService.userExists(payload.userId);
      await this.channelService.channelExists(payload.channelId);
    } catch (error) {
      socket.disconnect();
      throw new UnauthorizedException('User or channel does not exist');
    }

    if (!payload.channelId) {
      throw new BadRequestException('No channel id provided');
    }

    try {
      socket.leave(String(payload.channelId));
      console.log(
        `Client socket ${socket.id}, left channel: ${payload.channelId}`,
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
  @SubscribeMessage('quitChannel')
  async handleQuitChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ConnectToChannel,
  ): Promise<void> {
    try {
      await this.channelService.userExists(payload.userId);
      await this.channelService.channelExists(payload.channelId);
    } catch (error) {
      socket.disconnect();
      throw new UnauthorizedException('User or channel does not exist');
    }

    if (!payload.channelId) {
      throw new BadRequestException('No channel id provided');
    }

    try {
      this.channelService.quitChannel(payload);
      socket.leave(String(payload.channelId));
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
      console.log('Client disconnected');
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //
  //
  //
  @SubscribeMessage('banUser')
  async handleBanUser(@MessageBody() payload: ActionOnUser) {
    this.channelService.banUser(payload);
  }

  //
  //
  //
  @SubscribeMessage('unbanUser')
  async handleUnbanUser(@MessageBody() payload: ActionOnUser) {
    this.channelService.unbanUser(payload);
  }

  //
  //
  //
  // @SubscribeMessage('kickUser')
  // async handleKickUser() {

  //   socket.leave() for the kicked user // !!! need to find how
  // }

  //
  //
  //
  @SubscribeMessage('muteUser')
  async handleMuteUser(@MessageBody() payload: MuteUser) {
    this.channelService.muteUser(payload);
  }

  //
  //
  //
  @SubscribeMessage('unmuteUser')
  async handleUnmute(@MessageBody() payload: MuteUser) {
    this.channelService.unmuteUser(payload);
  }

  //
  //
  //blocked user can still send messages but the user who blocked cannot see them
  //blocked works for all the channels
  @SubscribeMessage('blockUser')
  async handleBlockUser(@MessageBody() payload: BlockUser) {
    this.channelService.blockUser(payload);
  }

  //
  //
  //
  @SubscribeMessage('unblockUser')
  async hadleUnblockUser(@MessageBody() payload: BlockUser) {
    this.channelService.unblockUser(payload);
  }

  //
  //
  //
  @SubscribeMessage('addChannelAdmin')
  async handleAddChannelAdmin(@MessageBody() payload: ActionOnUser) {
    this.channelService.addAdministrator(payload);
  }

  //
  //
  //
  @SubscribeMessage('removeChannelAdmin')
  async handleRemoveChannelAdmin(@MessageBody() payload: ActionOnUser) {
    this.channelService.removeAdministrator(payload);
  }
}

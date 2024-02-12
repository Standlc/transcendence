import { ChannelService } from './channel.service';
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
import { ConnectToChannel, SocketAntiSpam } from 'src/types/channelsSchema';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
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
  // !!! to test
  // afterInit(socket: Socket) {
  //   socket.use((client, next) => {
  //     try {
  //       const payload: { id: number } = this.wsGuard.validateToken(
  //         client as any,
  //       );
  //       (client as any as Socket).data = payload;
  //       next();
  //     } catch (error) {
  //       console.error(error);
  //       next(new Error('not authorized'));
  //     }
  //   });
  // }

  //
  //
  //
  // !!! test it
  handleConnection(socket: SocketAntiSpam) {
    // try {
    console.log(`Client connected: ${socket.id}`);

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
    socket: Socket,
    payload: ConnectToChannel,
  ): Promise<void> {
    // Verify if user banned, channel exists, user exists
    try {
      await this.channelService.userExists(payload.userId);
      await this.channelService.channelExists(payload.channelId);
      await this.channelService.userIsBanned(payload.userId, payload.channelId);
    } catch (error) {
      socket.disconnect();
      throw new UnauthorizedException(
        'User, channel or both do not exist | User is banned',
      );
    }

    // !!! TODO = verify if user invited, + the right password
    //

    if (!payload.channelId) {
      throw new BadRequestException('No channel id provided');
    }

    try {
      socket.join(String(payload.channelId)); // join room
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
  async handleMessage(socket: Socket, payload: ChannelMessage): Promise<void> {
    try {
      await this.channelService.userIsBanned(
        payload.senderId,
        payload.channelId,
      );
    } catch (error) {
      socket.disconnect();
      throw new UnauthorizedException(
        'User, channel or both do not exist | User is banned',
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
      this.channelService.createMessage(payload);
    } catch (error) {
      socket.disconnect();
      console.error(error);
      throw new InternalServerErrorException();
    }

    if (!payload.channelId)
      throw new BadRequestException('No channel id provided');

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
    socket: Socket,
    payload: ConnectToChannel,
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
      // !!! TODO
      // if (user is owner of the channel) 
      // this.channelService.leaveChannelMembersAsOwner(userId, channelId);

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
  handleDisconnect(@ConnectedSocket() socket: Socket) {
    try {
      socket.disconnect();
      console.log('Client disconnected');
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // !!! pseudocode area

  /*
  @SubscribeMessage('banUser')
  async handleBanUser() {

    this.ChannelService.banUser(userId, userToBanId, channelId);
  }
  */


  /*
  @SubscribeMessage('unbanUser')
  async handleUnbanUser() {
    
    this.ChannelService.unbanUser(userId, userToUnbanId, channelId);
  }
  */


  /*
  @SubscribeMessage('kickUser')
  async handleKickUser() {

    socket.leave() for the kicked user // !!! need to find how
  }
  */


  /*
  @SubscribeMessage('muteUser')
  async handleMuteUser() {

    this.ChannelService.muteUser(userId, userToMuteId, channelId, Date() of end of mute);
  }
  */


  /*
  @SubsribeMessage('unmuteUser')
  async handleUnmute() {

    this.ChannelService.async unmuteUser(userId, userToUnmuteId, channelId);
  }
  */


  /*
  @SubscribeMessage('blockUser')
  async handleBlockUser() {

    //blocked user can still send messages but the user who blocked cannot see them
    //blocked works for all the channels

    this.ChannelService.blockUser(userId, userToBlock);

  }
  */
 

  /*
  @SubscribeMessage('unblockUser')
  async hndleUnblockUser() {

    this.ChannelService.unblockUser(userId, userToUnblock);
  }
  */


}

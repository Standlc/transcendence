import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class ConnectedUsersService {
  private connectedUsers: Map<number, Socket> = new Map();

  addUser(userId: number, socket: Socket): void {
    this.connectedUsers.set(userId, socket);
    this.printAllUsers();
  }

  removeUserWithUserId(userId: number): void {
    this.connectedUsers.delete(userId);
    this.printAllUsers();
  }

  removeUserWithSocketId(socketId: string): void {
    const userId = this.getUserId(socketId);

    if (userId !== undefined) {
      this.connectedUsers.delete(userId);
    } else {
      console.log(`User not found for socket ID: ${socketId}`);
    }
    this.printAllUsers();
  }

  getUserId(socketId: string): number | undefined {
    for (const [userId, targetId] of this.connectedUsers.entries()) {
      if (targetId.id === socketId) {
        return userId;
      }
    }
    return undefined;
  }

  getSocket(userId: number): Socket | undefined {
    return this.connectedUsers.get(userId);
  }

  getAllConnectedUsers(): Map<number, Socket> {
    this.printAllUsers();
    return this.connectedUsers;
  }

  printAllUsers(): void {
    const userIds: number[] = Array.from(this.connectedUsers.keys());
    console.log('All connected user IDs:', userIds);
  }

  verifyConnection(socket: Socket): void {
    if (this.getUserId(socket.id) === undefined) {
      throw new UnauthorizedException(
        "User did not join channel room with the 'joinchannel' event",
      );
    }
    console.log('User is connected to the socket io room');
  }
}

import { Socket } from 'socket.io';
import { Channel, DirectMessage, Generated, Timestamp } from './schema';

export type ChannelDataWithoutPassword = Omit<Channel, 'password'>;

export type ChannelCreationData = Omit<
  Channel,
  'channelOwner' | 'createdAt' | 'id'
>;

export type UserId = { userId: number };

export type DirectMessageContent = Omit<DirectMessage, 'createdAt' | 'id'>;

// combine User interface and Channel interface
export interface MessageWithSenderInfo {
  channelId: number;
  content: string | null;
  createdAt: Generated<Timestamp>;
  messageId: Generated<number>;
  senderId: number;
  isOwner: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isMuted: boolean;
  avatarUrl: string | null;
  username: string;
}

export interface DmWithSenderInfo {
  content: string | null;
  conversationId: number;
  createdAt: Generated<Timestamp>;
  messageId: Generated<number>;
  senderId: number;
  avatarUrl: string | null;
  username: string;
}

export interface ConnectToChannel {
  channelId: number;
  userId: number;
}

export interface ConnectToDm {
  conversationId: number;
  userId: number;
}

export interface SocketAntiSpam extends Socket {
  requestCount?: number;
}

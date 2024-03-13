import { Selectable } from 'kysely';
import { Channel, ChannelMessage, DirectMessage } from './schema';

export interface ChannelCreationData {
  isPublic: boolean;
  name: string;
  password: string | null;
  photoUrl: string | null;
}

export type ChannelWithoutPsw = Omit<Selectable<Channel>, 'password'>;

export type UserId = { userId: number };

export type DirectMessageContent = Omit<
  DirectMessage,
  'createdAt' | 'id' | 'senderId'
>;

export type ChannelMessageContent = Omit<
  ChannelMessage,
  'createdAt' | 'id' | 'senderId'
>;

export interface ChannelDataWithUsersWithoutPassword {
  channelOwner: number;
  createdAt: Date;
  id: number;
  isPublic: boolean;
  name: string;
  photoUrl: string | null;
  users: UserInfo[];
}

export interface ChannelDataWithoutPassword {
  channelOwner: number;
  createdAt: Date;
  id: number;
  isPublic: boolean;
  name: string;
  photoUrl: string | null;
}

export interface UserInfo {
  userId: number;
  username: string;
  avatarUrl: string;
  rating: number;
  status: number;
}

// combine User interface and Channel interface
export interface MessageWithSenderInfo {
  avatarUrl: string | null;
  username: string;
  channelId: number;
  messageContent: string | null;
  createdAt: Date;
  messageId: number;
  senderId: number;
  isOwner: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isMuted: boolean;
  senderIsBlocked: boolean;
}

export interface DmWithSenderInfo {
  content: string | null;
  conversationId: number;
  createdAt: Date;
  messageId: number;
  senderId: number;
  avatarUrl: string | null;
  username: string;
  senderIsBlocked: boolean;
}

export interface ConnectToChannel {
  channelId: number;
  password: string;
}

export interface ActionOnUser {
  targetUserId: number;
  channelId: number;
}

export interface MuteUser {
  targetUserId: number;
  channelId: number;
  muteEnd: Date | null;
}

export interface AllConversationsPromise {
  id: number;
  createdAt: Date;
  user1: {
    userId: number;
    avatarUrl: string;
    username: string;
    rating: number;
    status: number;
  };
  user2: {
    userId: number;
    avatarUrl: string;
    username: string;
    rating: number;
    status: number;
  };
}

export interface ChannelUpdate {
  isPublic: boolean;
  name: string | null;
  password: string | null;
}

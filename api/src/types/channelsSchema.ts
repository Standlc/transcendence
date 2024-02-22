import { Channel, ChannelMessage, DirectMessage } from './schema';

export type ChannelCreationData = Omit<
  Channel,
  'channelOwner' | 'createdAt' | 'id'
>;

export type UserId = { userId: number };

export type DirectMessageContent = Omit<DirectMessage, 'createdAt' | 'id'>;

export type ChannelMessageContent = Omit<ChannelMessage, 'createdAt' | 'id'>;

export interface ChannelDataWithoutPassword {
  channelOwner: number;
  createdAt: Date;
  id: number;
  isPublic: boolean;
  name: string | null;
  photoUrl: string | null;
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
  userId: number;
  password: string;
  isPublic: boolean;
  channelOwner: number;
}

export interface ConnectToDm {
  conversationId: number;
  userId: number;
}

export interface ActionOnUser {
  userId: number;
  targetUserId: number;
  channelId: number;
}

export interface MuteUser {
  userId: number;
  targetUserId: number;
  channelId: number;
  muteEnd: Date | null;
}

export interface BlockUser {
  userId: number;
  targetUserId: number;
}

export interface ConversationPromise {
  id: number;
  createdAt: Date;
  user1_id: number;
  user2_id: number;
}

export interface QuitChannel {
  channelId: number;
  userId: number;
}

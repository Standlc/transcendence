import { ChannelMessage, DirectMessage } from './schema';

export interface ChannelCreationData {
  isPublic: boolean;
  name: string;
  password: string | null;
  photoUrl: string | null;
}

export type UserId = { userId: number };

export type DirectMessageContent = Omit<
  DirectMessage,
  'createdAt' | 'id' | 'senderId'
>;

export type ChannelMessageContent = Omit<
  ChannelMessage,
  'createdAt' | 'id' | 'senderId'
>;

export interface ChannelDataWithoutPassword {
  channelOwner: number;
  createdAt: Date;
  id: number;
  isPublic: boolean;
}

export interface ChannelDataWithUsersWithoutPassword {
  channelOwner: number;
  createdAt: Date;
  id: number;
  isPublic: boolean;
  users: UserInfo[];
}

export interface UserInfo {
  userId: number;
  username: string;
  avatarUrl: string;
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

export interface ConversationPromise {
  id: number;
  createdAt: Date;
  user1_id: number;
  user2_id: number;
}

export interface AllConversationsPromise {
  id: number;
  createdAt: Date;
  user1: {
    userId: number;
    avatarUrl: string;
    username: string;
  };
  user2: {
    userId: number;
    avatarUrl: string;
    username: string;
  };
}

export interface ChannelUpdate {
  isPublic: boolean;
  name: string | null;
  password: string | null;
}

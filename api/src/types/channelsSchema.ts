import { Selectable } from 'kysely';
import { Channel, ChannelMessage, DirectMessage } from './schema';

export interface ChannelCreationData {
  isPublic: boolean;
  name: string;
  password: string | null;
  memberIds: number[];
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

export type UserChannel = Selectable<Channel>;

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

export interface UserConversationType {
  id: number;
  createdAt: Date;
  user: {
    id: number;
    avatarUrl: string | null;
    username: string;
    rating: number;
    status: number;
  };
}

export interface UserConversation {
  id: number;
  createdAt: Date;
  user1: ConversationUser;
  user2: ConversationUser;
  isBlocked: boolean;
}

export type ConversationUser = {
  userId: number;
  avatarUrl: string | null;
  username: string;
};

export interface ChannelUpdate {
  isPublic: boolean;
  name: string;
  password: string | null;
}

export type PublicChannel = {
  membersCount: number | null;
  isMember: boolean;
  id: number;
  name: string | null;
  photoUrl: string | null;
  isProtected: boolean;
};

export type ChannelJoinDto = {
  channelId: number;
  password?: string;
};

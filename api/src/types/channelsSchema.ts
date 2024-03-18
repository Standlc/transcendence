import { Selectable, SqlBool } from 'kysely';
import { Channel, ChannelMessage, DirectMessage } from './schema';

export type ChannelServerEventTypes = {
  joinChannel: ConnectToChannel;
  leaveChannel: ConnectToChannel;
  createChannelMessage: ChannelMessageContent;
};

export type ChannelServerEmitTypes = {
  createChannelMessage: UserChannelMessage;
  memberLeave: ChannelAndUserIdPayload;
  memberBanned: ChannelAndUserIdPayload;
  memberJoin: ChannelAndUserIdPayload;
  newAdmin: ChannelAndUserIdPayload;
  adminRemove: ChannelAndUserIdPayload;
  newChannel: number;
  channelDelete: number;
  memberMuted: ChannelAndUserIdPayload;
  channelUpdated: number;
  userBanned: ChannelAndUserIdPayload;
  userUnbanned: ChannelAndUserIdPayload;
};

export type ChannelAndUserIdPayload = {
  userId: number;
  channelId: number;
};

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
  isProtected: boolean;
  name: string;
  photoUrl: string | null;
  users: UserInfo[];
}

export interface UserInfo {
  userId: number;
  isBlocked: SqlBool;
  username: string;
  avatarUrl: string | null;
  rating: number;
  mutedEnd: Date | null;
  status: number;
  isAdmin: boolean;
}

export type UpdatedChannel = {
  name: string;
  photoUrl: string | null;
  id: number;
  isPublic: boolean;
  isProtected: boolean;
};

export type UserChannel = {
  name: string;
  photoUrl: string | null;
  id: number;
  isPublic: boolean;
  isProtected: boolean;
  isUserAdmin: boolean;
  ownerId: number;
};

export interface MessageWithSenderInfo {
  avatarUrl: string | null;
  username: string;
  messageContent: string | null;
  createdAt: Date;
  id: number;
  senderId: number;
  isBlocked: SqlBool;
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

export type ChannelUpdate = {
  password?: string | null;
  name?: string;
  isPublic?: boolean;
};

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

export type UserChannelMessage = Selectable<ChannelMessage>;

export type ChannelBannedUser = {
  username: string;
  avatarUrl: string | null;
  rating: number;
  id: number;
};

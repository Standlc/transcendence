import { Timestamp } from "@api/types/schema";

export interface CreateChannelResponse {
    channelOwner: number;
    createdAt: Date;
    id: number;
    isPublic: boolean;
    name: string;
    photoUrl: string | null;
    users: ChannelUser[];
}

export interface ChannelUser {
    userId: number;
    username: string;
    avatarUrl: string;
    rating: number;
    status: number;
}

interface User {
    userId: number;
    username: string;
    avatarUrl: string;
}

export interface AllChannels {
    channelOwner: number;
    createdAt: Timestamp;
    id: number;
    isPublic: boolean;
    name: string;
    photoUrl: string | null;
    users: User[];
}

export interface ChannelNewMessage {
    avatarUrl: string | null;
    content: string | null;
    conversationId: number;
    createdAt: Date;
    messageId: number;
    senderId: number;
    senderIsBlocked: boolean;
    username: string;
}

export interface getChannelInfo {
    channelOwner: number;
    createdAt: Date;
    id: number;
    isPublic: boolean;
    name: string;
    photoUrl: string | null;
    schema: {
        userId: number;
        username: string;
        avatarUrl: string;
        rating: number;
        status: number;
    };
}

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

export interface ChannelMessages {
channelId: number,
messageContent: string | null,
createdAt: Date,
messageId: number,
senderId: number,
isOwner: boolean,
isAdmin: boolean,
isBanned: boolean,
isMuted: boolean,
mutedEnd: Date | null,
avatarUrl: string | null,
username: string,
senderIsBlocked: boolean
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

import { Timestamp } from "@api/types/schema";

export interface CreateChannelResponse {
    channelOwner: number;
    createdAt: Timestamp;
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

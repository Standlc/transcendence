import { Timestamp } from "@api/types/schema";

export interface CreateChannelResponse {
    channelOwner: number;
    createdAt: Timestamp;
    id: number;
    isPublic: boolean;
    name: string;
    photoUrl: string;
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

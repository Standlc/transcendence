import { Timestamp } from "@api/types/schema";

export interface MessageDm {
    avatarUrl: string | null;
    content: string;
    conversationId: number;
    createdAt: Timestamp;
    messageId: number;
    senderId: number;
    senderIsBlocked: boolean;
    username: string;
}

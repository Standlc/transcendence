// import { Timestamp } from "@api/types/schema";

export interface MessageDm {
    avatarUrl: string | null;
    content: string | null;
    conversationId: number;
    createdAt: Date;
    messageId: number;
    senderId: number;
    senderIsBlocked: boolean;
    username: string;
}

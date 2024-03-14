import { ChannelMessages } from "../../types/channel";
import { MessageDm } from "../../types/messageDm";

export const shouldDisplayAvatarAndTimestamp = (currentIndex: number, messages: (ChannelMessages | MessageDm)[]): boolean => {
    if (currentIndex === 0 || !messages) {
        return true;
    }

    const previousMessage = messages[currentIndex - 1];
    const currentMessage = messages[currentIndex];

    return previousMessage.senderId !== currentMessage.senderId;
};

export const shouldDisplayUsername = (currentIndex: number, messages: (ChannelMessages | MessageDm)[]): boolean => {
    if (currentIndex === 0 || !messages) {
        return true;
    }

    const previousMessage = messages[currentIndex - 1];
    const currentMessage = messages[currentIndex];

    return previousMessage.senderId !== currentMessage.senderId;
};

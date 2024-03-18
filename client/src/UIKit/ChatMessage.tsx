import { useContext, useState } from "react";
import { Avatar } from "./avatar/Avatar";
import { DateTime } from "luxon";
import { UserProfileContext } from "../ContextsProviders/UserProfileIdContext";

export const ChatMessage = ({
  showAvatar,
  message,
}: {
  showAvatar: boolean;
  message: {
    content: string | null;
    createdAt: Date;
    isBlocked: boolean | number;
    senderUsername: string;
    senderAvatar: string | null;
    senderId: number;
  };
}) => {
  const [displayMessage, setDisplayMessage] = useState(!message.isBlocked);
  const { setUserProfileId } = useContext(UserProfileContext);

  return (
    <div className={`flex gap-4 ${!showAvatar ? "-mt-3" : ""}`}>
      <div className="flex flex-col gap-0 pl-14 relative">
        {showAvatar && (
          <div
            onClick={() => setUserProfileId(message.senderId)}
            className="absolute left-0 cursor-pointer"
          >
            <Avatar
              imgUrl={message.senderAvatar}
              userId={message.senderId}
              size="md"
              borderRadius={0.5}
            />
          </div>
        )}
        {showAvatar && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserProfileId(message.senderId)}
              className="font-bold opacity-100"
            >
              {message.senderUsername}
            </button>
            <div className="text-xs opacity-40">
              {DateTime.fromISO(message.createdAt as any).toFormat(
                "dd/mm/yyyy, h:m"
              )}
            </div>
          </div>
        )}
        <div className="">
          {!displayMessage ? (
            <div
              onClick={() => setDisplayMessage(true)}
              className="opacity-30 cursor-pointer"
            >
              This message is blocked
            </div>
          ) : (
            <div className="whitespace-pre-wrap [word-break:break-word] opacity-90">
              {message.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

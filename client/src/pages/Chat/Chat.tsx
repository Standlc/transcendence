import { useState, useEffect, useRef, useContext } from "react";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useParams } from "react-router-dom";
import { useGetUser } from "../../utils/useGetUser";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ConversationUser,
  DmWithSenderInfo,
  UserConversation,
} from "@api/types/channelsSchema";
import { MessageDm } from "../../types/messageDm";
import TextArea from "../../UIKit/TextArea";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { UserProfileContext } from "../../ContextsProviders/UserProfileIdContext";
import { SendGameInvitationModal } from "../../components/SendGameInvitationModal";
import { ChatMessage } from "../../UIKit/ChatMessage";
import { SportsEsports } from "@mui/icons-material";
import { Spinner } from "../../UIKit/Kit";
import { NoResult } from "../../UIKit/NoResult";

const Chat = () => {
  const { dmId } = useParams();
  const user = useGetUser();
  const [textAreaValue, setTextAreaValue] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { conversationSocket } = useContext(SocketsContext);
  const { setUserProfileId } = useContext(UserProfileContext);
  const [showGameInvitationModal, setShowGameInvitationModal] = useState(false);
  const [otherUser, setOtherUser] = useState<ConversationUser | null>(null);

  const conversation = useQuery({
    queryKey: ["conversationAllUser", dmId],
    queryFn: async () => {
      const res = await axios.get<UserConversation>(`/api/dm/${dmId}`);
      return res.data;
    },
  });

  const allMessages = useQuery<MessageDm[]>({
    queryKey: ["allMessages", dmId],
    queryFn: async (): Promise<MessageDm[]> => {
      if (!dmId) {
        return [];
      }
      const response = await axios.get<MessageDm[]>(`/api/dm/${dmId}/messages`);
      return response.data;
    },
  });

  useEffect(() => {
    if (conversation.data) {
      const currentOtherUser =
        conversation.data.user1.userId === user?.id
          ? conversation.data.user2
          : conversation.data.user1;
      setOtherUser(currentOtherUser);
    }
  }, [dmId, conversation.data, user?.id]);

  useEffect(() => {
    if (!dmId) return;

    conversationSocket.emit("joinConversation", { conversationId: dmId });

    conversationSocket.on(
      "createDirectMessage",
      (newMessage: DmWithSenderInfo) => {
        if (!conversation.data) return;
        queryClient.setQueryData<MessageDm[]>(["allMessages", dmId], (prev) => {
          if (!prev) return undefined;
          return [...prev, newMessage];
        });
      }
    );
    return () => {
      conversationSocket.off("createDirectMessage");
      conversationSocket.emit("leaveConversation", { conversationId: dmId });
    };
  }, [dmId, conversation.data]);

  useEffect(() => {
    if (
      messagesEndRef.current &&
      allMessages.data &&
      allMessages.data.length > 0
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages.data]);

  const sendMessage = () => {
    if (textAreaValue.trim() && dmId) {
      const messageData = {
        content: textAreaValue,
        conversationId: dmId,
        senderId: user?.id,
      };

      conversationSocket.emit("createDirectMessage", messageData);

      setTextAreaValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(e.target.value);
  };

  const shouldDisplayAvatarAndTimestamp = (currentIndex: number): boolean => {
    if (currentIndex === 0 || !allMessages.data) {
      return true;
    }

    const previousMessage = allMessages.data[currentIndex - 1];
    const currentMessage = allMessages.data[currentIndex];

    return previousMessage.senderId !== currentMessage.senderId;
  };

  return (
    <div className="w-full flex flex-col bg-discord-light-grey">
      {showGameInvitationModal && (
        <SendGameInvitationModal
          invitedUser={{
            username: otherUser?.username ?? "",
            id: otherUser?.userId ?? 0,
          }}
          hide={() => setShowGameInvitationModal(false)}
        />
      )}
      <div className="bg-discord-greyple flex items-center px-4 py-2 justify-between h-[60px] width-full border-b border-b-[rgba(0,0,0,0.3)]">
        <div
          onClick={() => setUserProfileId(otherUser?.userId)}
          className="flex cursor-pointer items-center gap-3"
        >
          <Avatar
            imgUrl={otherUser?.avatarUrl}
            size="sm"
            userId={otherUser?.userId ?? 0}
            borderRadius={0.5}
          />
          <span className="font-bold whitespace-nowrap">
            {otherUser?.username}
          </span>
        </div>
        <div className="text-right">
          <button
            onClick={() => setShowGameInvitationModal(true)}
            className="text-right active:translate-y-[1px] font-semibold bg-indigo-500 rounded-xl w-[35px] aspect-square flex items-center justify-center"
          >
            <SportsEsports />
          </button>
        </div>
      </div>

      <div className="text-white text-left h-full w-full p-5 overflow-y-auto break-all flex flex-col gap-3">
        {allMessages.isPending ? (
          <Spinner isLoading />
        ) : allMessages.isError ? (
          <NoResult description="Oops, we could not find this chat" />
        ) : (
          allMessages.data?.map((msg, index) => (
            <ChatMessage
              key={index}
              showAvatar={shouldDisplayAvatarAndTimestamp(index)}
              message={{
                content: msg.content,
                createdAt: msg.createdAt,
                isBlocked: false,
                senderUsername: msg.username,
                senderAvatar: msg.avatarUrl,
                senderId: msg.senderId,
              }}
            />
          ))
        )}
      </div>

      <label
        htmlFor="chat-input"
        className="bg-black bg-opacity-20 cursor-text mt-auto py-[10px] px-3 flex items-center rounded-lg ml-5 mr-5 mb-5"
      >
        <TextArea
          id="chat-input"
          value={textAreaValue}
          onChange={handleTextAreaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type something..."
          autoFocus={true}
        />
      </label>
    </div>
  );
};

export default Chat;

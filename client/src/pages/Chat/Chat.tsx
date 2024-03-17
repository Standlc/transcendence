import { useState, useEffect, useRef, useContext } from "react";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUser } from "../../utils/useGetUser";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DmWithSenderInfo, UserConversation } from "@api/types/channelsSchema";
import { MessageDm } from "../../types/messageDm";
import TextArea from "../../UIKit/TextArea";
import { UserDirectMessage } from "@api/types/clientSchema";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { UserProfileContext } from "../../ContextsProviders/UserProfileIdContext";
import { SendGameInvitationModal } from "../../components/SendGameInvitationModal";

const Chat = () => {
  const { dmId } = useParams();
  const user = useGetUser();
  const navigate = useNavigate();
  const [textAreaValue, setTextAreaValue] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { conversationSocket } = useContext(SocketsContext);
  const { setUserProfileId } = useContext(UserProfileContext);
  const [showGameInvitationModal, setShowGameInvitationModal] = useState(false);

  const conversation = useQuery({
    queryKey: ["conversationAllUser"],
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

  const otherUser = conversation.data
    ? conversation.data.user1.userId === user?.id
      ? conversation.data.user2
      : conversation.data.user1
    : null;

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

  const shouldDisplayUsername = (currentIndex: number): boolean => {
    if (currentIndex === 0 || !allMessages.data) {
      return true;
    }

    const previousMessage = allMessages.data[currentIndex - 1];
    const currentMessage = allMessages.data[currentIndex];

    return previousMessage.senderId !== currentMessage.senderId;
  };

  const renderMessages = () => {
    return allMessages.data?.map((msg, index) => (
      <div
        className="mt-[20px]"
        key={index}
        ref={index === allMessages.data.length - 1 ? messagesEndRef : null}
      >
        <div className="flex">
          {shouldDisplayAvatarAndTimestamp(index) && (
            <div className="flex">
              <Avatar
                imgUrl={msg.avatarUrl}
                userId={msg.senderId}
                size="md"
                borderRadius={0.5}
              />
              {shouldDisplayUsername(index) && (
                <div className="font-bold ml-[30px]">{msg.username}</div>
              )}
            </div>
          )}

          {shouldDisplayAvatarAndTimestamp(index) && (
            <div className="ml-[10px] mt-[4px] text-[13px]">
              {new Date(msg.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          )}
        </div>
        <div className="mt-[-15px] block text-md ml-[80px] hover:bg-discord-dark-grey ">
          {msg.content}
        </div>
      </div>
    ));
  };

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClickPlay = () => {
    navigate("/play");
  };

  if (!dmId) {
    return <div>Please select a conversation to start chatting.</div>;
  }

  if (!conversation.data) {
    return <div>Loading...</div>;
  }

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
      <div
        className="bg-discord-greyple h-[60px] width-full flexborder-b border-b-almost-black"
        style={{ borderBottomWidth: "3px" }}
      >
        <div className="w-full flex justify-between items-center">
          <div className="w-full flex">
            <div
              onClick={() => setUserProfileId(otherUser?.userId)}
              className="flex cursor-pointer"
            >
              <div className="flex item-center mt-[10px] ml-[20px]">
                <Avatar
                  imgUrl={otherUser?.avatarUrl}
                  size="md"
                  userId={otherUser?.userId ?? 0}
                  borderRadius={0.5}
                />
              </div>
              <div className="ml-2 mt-4 font-bold text-xl">
                <button onClick={openPopup}>{otherUser?.username}</button>
              </div>
            </div>
            <div className="w-full text-right mr-4">
              <button
                onClick={() => setShowGameInvitationModal(true)}
                className="text-right ml-4 mt-4 bg-green-500 hover:bg-green-700 rounded-lg py-1 px-3"
              >
                Play
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-white text-left h-full w-full p-5 overflow-y-auto break-all">
        {renderMessages()}
      </div>

      <div className="bg-discord-dark-grey mt-auto p-2 rounded-lg ml-5 mr-5 mb-5">
        <TextArea
          value={textAreaValue}
          onChange={handleTextAreaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type something..."
          autoFocus={true}
        />
      </div>
    </div>
  );
};

export default Chat;

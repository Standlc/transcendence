import { useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import TextArea from "../../UIKit/TextArea";
import ModalLayout from "../../UIKit/ModalLayout";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useGetUser } from "../../utils/useGetUser";
import { PopUpCmd } from "./subComponents/PopUpCmd";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  ChannelServerEmitTypes,
  MessageWithSenderInfo,
  UserChannelMessage,
} from "@api/types/channelsSchema";
import { useGetChannel } from "../../utils/channels/useGetChannel";
import { useLeaveChannel } from "../../utils/channels/useLeaveChannel";
import { ChannelAvatar } from "../../UIKit/avatar/ChannelAvatar";
import { People } from "@mui/icons-material";
import { ChatMessage } from "../../UIKit/ChatMessage";
import { Spinner } from "../../UIKit/Kit";

export const Channel = () => {
  const { channelId } = useParams();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [textAreaValue, setTextAreaValue] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [muteCountdown, setMuteCountdown] = useState(0);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const user = useGetUser();
  const { chatSocket } = useContext(SocketsContext);
  const leaveChannel = useLeaveChannel();
  const chanInfo = useGetChannel(Number(channelId));

  const userMutedEnd = useMemo(() => {
    if (!chanInfo.data?.users) return;

    for (const u of chanInfo.data.users) {
      if (u.userId === user.id && u.mutedEnd) {
        return u.mutedEnd;
      }
    }
    return null;
  }, [user.id, chanInfo.data?.users]);

  const allMessagesChan = useQuery<MessageWithSenderInfo[]>({
    queryKey: ["allMessagesChan", channelId],
    queryFn: async () => {
      if (!channelId) {
        return [];
      }
      const response = await axios.get(`/api/channels/${channelId}/messages`);
      return response.data;
    },
  });

  const findUserById = (newMessage: UserChannelMessage) => {
    if (chanInfo.data?.users) {
      for (const user of chanInfo.data.users) {
        if (user.userId === newMessage.senderId) {
          return user;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (userMutedEnd) {
      const muteEndTime = new Date(userMutedEnd).getTime();
      const now = Date.now();
      const muteDuration = muteEndTime - now;

      if (muteDuration > 0) {
        setIsMuted(true);
        setMuteCountdown(Math.round(muteDuration / 1000));
        const timer = setInterval(() => {
          setMuteCountdown((currentCountdown) => {
            if (currentCountdown <= 1) {
              clearInterval(timer);
              setIsMuted(false);
              return 0;
            }
            return currentCountdown - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    }
    setIsMuted(false);
  }, [chanInfo.data?.users, user.id, userMutedEnd]);

  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${seconds}`;
    }
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current?.scrollHeight,
      });
    }
  }, [allMessagesChan.data]);

  useEffect(() => {
    if (!channelId) return;

    const handleMessageCreation = (
      newMessage: ChannelServerEmitTypes["createChannelMessage"]
    ) => {
      const messageUser = findUserById(newMessage);
      const pushedMessage: MessageWithSenderInfo = {
        avatarUrl: messageUser?.avatarUrl ?? null,
        messageContent: newMessage.content,
        senderId: newMessage.senderId,
        createdAt: newMessage.createdAt,
        id: newMessage.id,
        isBlocked: messageUser?.isBlocked ?? false,
        username: messageUser?.username ?? "Unkown",
      };

      queryClient.setQueryData<MessageWithSenderInfo[]>(
        ["allMessagesChan", channelId],
        (prev) => [...(prev ? prev : []), pushedMessage]
      );
    };
    chatSocket.emit("joinChannel", { channelId });

    chatSocket.on("leaveChannel", (data) => {
      console.log("leaveChannel", data);
    });
    chatSocket.on("joinChannel", () => {
      console.log("Connected to Channel");
    });

    chatSocket.on("createChannelMessage", handleMessageCreation);

    return () => {
      chatSocket.off("joinChannel");
      chatSocket.off("createChannelMessage");
      chatSocket.off("leaveChannel");
      chatSocket.off("messages");
    };
  }, [channelId, chatSocket, user, allMessagesChan]);

  const sendMessage = () => {
    if (!isMuted && textAreaValue.trim() && channelId) {
      const messageData = {
        content: textAreaValue,
        channelId: channelId,
      };

      chatSocket.emit("createChannelMessage", messageData);
      setTextAreaValue("");
    }
  };

  const handleTextAreaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!isMuted) setTextAreaValue(event.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const shouldDisplayAvatarAndTimestamp = (currentIndex: number): boolean => {
    if (currentIndex === 0 || !allMessagesChan.data) {
      return true;
    }

    const previousMessage = allMessagesChan.data[currentIndex - 1];
    const currentMessage = allMessagesChan.data[currentIndex];

    return previousMessage.senderId !== currentMessage.senderId;
  };

  return (
    <div
      className="w-full bg-discord-light-grey flex flex-col"
      style={{ height: "100vh" }}
    >
      <div className="bg-discord-greyple h-[60px] width-full flex border-b-[1px] border-b-[rgba(0,0,0,0.3)]">
        {chanInfo.data && (
          <div className="w-full flex justify-between items-center py-2 px-4">
            <div className="w-full flex items-center gap-2 font-bold">
              <ChannelAvatar
                imgUrl={chanInfo.data?.photoUrl}
                size="sm"
                id={chanInfo.data.id}
                borderRadius={1}
              />
              {chanInfo.data?.name}
            </div>
            <div className="flex items-center gap-5">
              <button
                className="opacity-80 hover:opacity-100"
                onClick={() => setIsCmdOpen(true)}
              >
                <People />
              </button>
              {chanInfo.data?.channelOwner != user.id && (
                <button
                  className="opacity-80 hover:opacity-100"
                  onClick={() => leaveChannel.mutate(chanInfo.data?.id ?? 0)}
                >
                  <LogoutIcon fontSize="small" />
                </button>
              )}
              {isCmdOpen && chanInfo.data && (
                <ModalLayout onClickOutside={() => setIsCmdOpen(false)}>
                  <PopUpCmd chanInfo={chanInfo.data} chatSocket={chatSocket} />
                </ModalLayout>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        ref={messagesContainerRef}
        className="text-white text-left h-full w-full p-4 overflow-y-auto break-all flex flex-col gap-3"
      >
        {allMessagesChan.isPending ? (
          <Spinner isLoading />
        ) : allMessagesChan.isError ? (
          <span className="opacity-50 text-lg text-center h-full flex items-center justify-center">
            Oops, we could not find this chat
          </span>
        ) : (
          allMessagesChan.data?.map((msg, index) => {
            return (
              <ChatMessage
                key={index}
                showAvatar={shouldDisplayAvatarAndTimestamp(index)}
                message={{
                  ...msg,
                  content: msg.messageContent,
                  senderAvatar: msg.avatarUrl,
                  senderUsername: msg.username,
                }}
              />
            );
          })
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
          disabled={isMuted}
          placeholder={
            isMuted
              ? `You are muted for ${formatCountdown(muteCountdown)} 🔇`
              : "Type something..."
          }
          autoFocus={true}
        />
      </label>
    </div>
  );
};

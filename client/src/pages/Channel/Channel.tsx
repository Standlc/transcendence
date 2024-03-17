import { useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import TextArea from "../../UIKit/TextArea";
import { Avatar } from "../../UIKit/avatar/Avatar";
import ModalLayout from "../../UIKit/ModalLayout";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useGetUser } from "../../utils/useGetUser";
import { PopUpCmd } from "./subComponents/PopUpCmd";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  ChannelServerEmitTypes,
  MessageWithSenderInfo,
  UserChannelMessage,
} from "@api/types/channelsSchema";
import { useGetChannel } from "../../utils/channels/useGetChannel";
import { useLeaveChannel } from "../../utils/channels/useLeaveChannel";
import { ChannelAvatar } from "../../UIKit/avatar/ChannelAvatar";

export const Channel = () => {
  const { channelId } = useParams();
  const queryClient = useQueryClient();
  const [textAreaValue, setTextAreaValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [muteCountdown, setMuteCountdown] = useState(0);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const user = useGetUser();
  const { chatSocket } = useContext(SocketsContext);
  const leaveChannel = useLeaveChannel();
  const chanInfo = useGetChannel(Number(channelId));
  const [blockedMessagesIds, setBlockedMessagesIds] = useState<number[]>([]);

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
      //   DateTime
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
    if (
      messagesEndRef.current &&
      allMessagesChan.data &&
      allMessagesChan.data.length > 0
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessagesChan.data]);

  useEffect(() => {
    if (!channelId) return;

    const handleMessageCreation = (
      newMessage: ChannelServerEmitTypes["createChannelMessage"]
    ) => {
      console.log("newMessage", newMessage);
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

      console.log("messageData", messageData);
      chatSocket.emit("createChannelMessage", messageData);
      setTextAreaValue("");
    }
  };

  const handleTextAreaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTextAreaValue(event.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendMessage();
    }
  };

  const handleBlockMessageClick = (messageId: number) => {
    setBlockedMessagesIds((prevIds) => {
      if (!prevIds.includes(messageId)) {
        return [...prevIds, messageId];
      }
      return prevIds;
    });
  };

  const isMessageBlockedAndHidden = (msg: MessageWithSenderInfo) => {
    return msg.isBlocked && !blockedMessagesIds.includes(msg.id);
  };

  const shouldDisplayAvatarAndTimestamp = (currentIndex: number): boolean => {
    if (currentIndex === 0 || !allMessagesChan.data) {
      return true;
    }

    const previousMessage = allMessagesChan.data[currentIndex - 1];
    const currentMessage = allMessagesChan.data[currentIndex];

    return previousMessage.senderId !== currentMessage.senderId;
  };

  const shouldDisplayUsername = (currentIndex: number): boolean => {
    if (currentIndex === 0 || !allMessagesChan.data) {
      return true;
    }

    const previousMessage = allMessagesChan.data[currentIndex - 1];
    const currentMessage = allMessagesChan.data[currentIndex];

    return previousMessage.senderId !== currentMessage.senderId;
  };

  console.log(allMessagesChan.data);

  const renderMessages = () => {
    if (
      allMessagesChan.isLoading ||
      allMessagesChan.isError ||
      !allMessagesChan.data
    ) {
      return <div>Loading messages...</div>;
    }

    return allMessagesChan.data.map((msg, index) => {
      return (
        <div
          key={index}
          ref={
            index === allMessagesChan.data.length - 1 ? messagesEndRef : null
          }
        >
          <div className="mt-[20px]" key={index}>
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
                    <div className="font-bold ml-[30px] opacity-80">
                      {msg.username}
                    </div>
                  )}
                </div>
              )}

              {shouldDisplayAvatarAndTimestamp(index) && (
                <div className="ml-[10px] mt-[4px] text-[13px] opacity-40">
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
            <div className="mt-[-15px] block text-md ml-[70px]">
              {isMessageBlockedAndHidden(msg) ? (
                <div
                  onClick={() => handleBlockMessageClick(msg.id)}
                  className="opacity-30 cursor-pointer"
                >
                  This message is blocked
                </div>
              ) : (
                <div onClick={() => handleBlockMessageClick(msg.id)}>
                  {msg.isBlocked ? (
                    <div> {msg.messageContent}</div>
                  ) : (
                    <div>{msg.messageContent}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };
  return (
    <div
      className="w-full bg-discord-light-grey flex flex-col"
      style={{ height: "100vh" }}
    >
      <div
        className="bg-discord-greyple h-[60px] width-full flex  border-b border-b-almost-black"
        style={{ borderBottomWidth: "3px" }}
      >
        {chanInfo.data && (
          <div className="w-full flex justify-between items-center ">
            <div className="w-full flex ">
              <div className="flex item-center  ml-[20px]">
                <ChannelAvatar
                  imgUrl={chanInfo.data?.photoUrl}
                  size="md"
                  id={chanInfo.data?.id ?? 0}
                  borderRadius={0.5}
                />
              </div>
              <div className="ml-2 mt-2 font-bold text-xl">
                <button>{chanInfo.data?.name}</button>
              </div>
            </div>
            <div className="flex">
              <button
                className="mr-5 hover:bg-black hover:bg-opacity-30 rounded-full py-2 px-2 justify-center"
                onClick={() => setIsCmdOpen(true)}
              >
                <PersonIcon />
              </button>
              {chanInfo.data?.channelOwner != user.id && (
                <button
                  className="mr-5 hover:bg-black hover:bg-opacity-30 rounded-full py-2 px-2 justify-center"
                  onClick={() => leaveChannel.mutate(chanInfo.data?.id ?? 0)}
                >
                  <LogoutIcon />
                </button>
              )}
              {isCmdOpen && (
                <ModalLayout onClickOutside={() => setIsCmdOpen(false)}>
                  <PopUpCmd
                    chanInfo={chanInfo.data}
                    chatSocket={chatSocket}
                    currentUser={user}
                  />
                </ModalLayout>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-white text-left h-full w-auto ml-[20px] overflow-auto">
        {renderMessages()}
      </div>
      <div className="bg-discord-dark-grey mt-auto p-2 rounded-lg ml-5 mr-5 mb-5">
        <TextArea
          value={textAreaValue}
          onChange={handleTextAreaChange}
          onKeyDown={handleKeyDown}
          disabled={isMuted}
          placeholder={
            isMuted
              ? `You are muted for ${formatCountdown(muteCountdown)}s 🔇`
              : "Type something..."
          }
          autoFocus={true}
        />
      </div>
    </div>
  );
};

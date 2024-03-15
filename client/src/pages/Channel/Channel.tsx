import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChannelMessages, CreateChannelResponse } from "../../types/channel";
import TextArea from "../../UIKit/TextArea";
import { Avatar } from "../../UIKit/avatar/Avatar";
import ModalLayout from "../../UIKit/ModalLayout";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChannelMessage } from "@api/types/schema";
import { useGetUser } from "../../utils/useGetUser";
import { PopUpCmd } from "./subComponents/PopUpCmd";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

export const Channel = () => {
    const { channelId } = useParams();
    const queryClient = useQueryClient();
    const [textAreaValue, setTextAreaValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);
    const [isCmdOpen, setIsCmdOpen] = useState(false);
    const user = useGetUser();
    const { chatSocket } = useContext(SocketsContext);

    const leaveChan = (password = null) => {
        if (channelId) {
            console.log("Attempting to leave channelId:", channelId);
            const body = {
                channelId: channelId,
                password: password,
            };
            chatSocket.emit("leaveChannel", body);
        }
    };

    const quitChannel = () => {
        if (channelId) {
            console.log("Attempting to quit channelId:", channelId);
            const body = {
                channelId: channelId,
            };
            chatSocket.emit("quitChannel", body);
        }
    };

    const allMessagesChan = useQuery<ChannelMessages[]>({
        queryKey: ["allMessagesChan", channelId],
        queryFn: async () => {
            if (!channelId) {
                return [];
            }
            const response = await axios.get(`/api/channels/${channelId}/messages`);
            return response.data;
        },
        enabled: !!channelId,
    });

    const chanInfo = useQuery<CreateChannelResponse>({
        queryKey: ["chanInfo", channelId],
        queryFn: async () => {
            const response = await axios.get(`/api/channels/${channelId}/channel`);
            console.log(response.data);
            return response.data;
        },
    });

    const findUserById = (newMessage: ChannelMessage) => {
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

        const handleMessage = (response: string) => {
            if (response.includes("quit the channel")) {
                console.log("JE QUITTE PAR ICI" );
                const userIdMatch = response.match(/User (\d+) quit the channel/);
                const userId = userIdMatch ? parseInt(userIdMatch[1], 10) : 0;
                if (userId === user?.id) {
                    navigate("/home");
                    queryClient.invalidateQueries({ queryKey: ["chanInfo", channelId]});
                    queryClient.invalidateQueries({ queryKey: ["allMessagesChan", channelId]});
                }
            }
        
            const adminActionMatch = response.match(/User (\d+) has been (\w+)/);
            if (adminActionMatch) {
                const userIdStr = adminActionMatch[1];
                const action = adminActionMatch[2];
            
                const userId = parseInt(userIdStr, 10);
                if (userId === user?.id) {
                    let actionMessage = `You have been ${action}.`;
                    if (action === "kicked") {
                        alert(actionMessage);
                        navigate("/home");
                    } else if (action === "banned") {
                        alert(actionMessage);
                        navigate("/home");
                    } else if (action === "muted") {
                        alert(actionMessage);
                        setIsMuted(true);
                        actionMessage = "You have been muted.";
                    }
                    queryClient.invalidateQueries({queryKey : ["chanInfo", channelId]});
                    queryClient.invalidateQueries({queryKey  : ["allMessagesChan", channelId]});
                    queryClient.invalidateQueries({queryKey : ["channels"]});
                }
            }
        };

        const handleMessageCreation = (newMessage: ChannelMessage) => {
            if (!channelId) return;
            console.log("newMessage", newMessage);
            const messageUser = findUserById(newMessage);
            const pushedMessage: ChannelMessages = {
                avatarUrl: messageUser?.avatarUrl ?? null,
                channelId: newMessage.channelId,
                messageContent: newMessage.content,
                senderId: newMessage.senderId,
                createdAt: newMessage.createdAt,
            };

            queryClient.setQueryData<ChannelMessages[]>(
                ["allMessagesChan", channelId],
                (prev) => [...(prev ? prev : []), pushedMessage]
            );
        };

        chatSocket.on("leaveChannel", (data) => {
            console.log("leaveChannel", data);
        });
        chatSocket.on("message", handleMessage);
        chatSocket.emit("joinChannel", { channelId });
        chatSocket.on("joinChannel", () => {
            console.log("Connected to Channel");
        });
        chatSocket.on("createChannelMessage", handleMessageCreation);

        return () => {
            chatSocket.off("message");
            chatSocket.off("joinChannel");
            chatSocket.off("createChannelMessage");
            chatSocket.off("leaveChannel");
        };
    }, [channelId, chatSocket, user, allMessagesChan]);

    const sendMessage = () => {
        if (textAreaValue.trim() && channelId) {
            const messageData = {
                content: textAreaValue,
                channelId: channelId,
            };

            chatSocket.emit("createChannelMessage", messageData);
            setTextAreaValue("");
        }
    };

    const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextAreaValue(event.target.value);
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

    const shouldDisplayUsername = (currentIndex: number): boolean => {
        if (currentIndex === 0 || !allMessagesChan.data) {
            return true;
        }

        const previousMessage = allMessagesChan.data[currentIndex - 1];
        const currentMessage = allMessagesChan.data[currentIndex];

        return previousMessage.senderId !== currentMessage.senderId;
    };

    const renderMessages = () => {
        if (
            allMessagesChan.isLoading ||
            allMessagesChan.isError ||
            !allMessagesChan.data
        ) {
            return <div>Loading messages...</div>;
        }

        return allMessagesChan.data.map((msg, index) => (
            <div
                key={index}
                ref={index === allMessagesChan.data.length - 1 ? messagesEndRef : null}
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
                                    <div className="font-bold ml-[30px]">
                                        {msg.username}
                                    </div>
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
                        {msg.messageContent}
                    </div>
                </div>
            </div>
        ));
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
                <div className="w-full flex justify-between items-center ">
                    <div className="w-full flex ">
                        <div className="flex item-center  ml-[20px]">
                            <Avatar
                                imgUrl={chanInfo.data?.photoUrl}
                                size="md"
                                userId={chanInfo.data?.id ?? 0}
                                borderRadius={0.5}
                            />
                        </div>
                        <div className="ml-2 mt-2 font-bold text-xl">
                            <button>{chanInfo.data?.name}</button>
                            <span className="ml-[20px]">|</span>
                        </div>
                        <div className="ml-5 mt-2 text-xl">
                            <div>USERS</div>
                        </div>
                    </div>
                    <div className="flex">
                        <button
                            className="mr-5 hover:bg-black hover:bg-opacity-30 rounded-full py-2 px-2 justify-center"
                            onClick={() => setIsCmdOpen(true)}
                        >
                            <PersonIcon />
                        </button>
                        <button
                            className="mr-5 hover:bg-black hover:bg-opacity-30 rounded-full py-2 px-2 justify-center"
                            onClick={() => quitChannel()}
                        >
                            <LogoutIcon />
                        </button>
                        {isCmdOpen && (
                            <ModalLayout>
                                <PopUpCmd
                                    onClose={() => setIsCmdOpen(false)}
                                    chanInfo={chanInfo.data}
                                    chatSocket={chatSocket}
                                    currentUser={user}
                                />
                            </ModalLayout>
                        )}
                    </div>
                </div>
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
                    placeholder="Type something..."
                    autoFocus={true}
                />
            </div>
        </div>
    );
};

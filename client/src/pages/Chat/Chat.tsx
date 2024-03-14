import { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUser } from "../../utils/useGetUser";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserConversation } from "@api/types/channelsSchema";
import { MessageDm } from "../../types/messageDm";
import TextArea from "../../UIKit/TextArea";
import { UserDirectMessage } from "@api/types/clientSchema";

const Chat = () => {
    const { dmId } = useParams();
    const user = useGetUser();
    const navigate = useNavigate();
    const socketRef = useRef<Socket>();
    // const [realTimeMessages, setRealTimeMessages] = useState<MessageDm[]>([]);
    const [textAreaValue, setTextAreaValue] = useState("");
    const queryClient = useQueryClient();

    const conversation = useQuery({
        queryKey: ["conversationAllUser"],
        queryFn: async () => {
            const res = await axios.get<UserConversation>(`/api/dm/${dmId}`);
            return res.data;
        },
    });

    useEffect(() => {
        console.log(conversation.data);
    }, [conversation.data]);

    const otherUser = conversation.data
        ? conversation.data.user1.userId === user?.id
            ? conversation.data.user2
            : conversation.data.user1
        : null;

    const allMessages = useQuery<MessageDm[]>({
        queryKey: ["allMessages", dmId],
        queryFn: async (): Promise<MessageDm[]> => {
            if (!dmId) {
                return [];
            }
            const response = await axios.get<MessageDm[]>(`/api/dm/${dmId}/messages`);
            return response.data;
        },
        enabled: !!dmId,
    });

    useEffect(() => {
        const socket = io("/dm");
        socketRef.current = socket;
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on("connect", () => console.log("Connected to server"));
        socketRef.current.on("connect_error", (error) =>
            console.error("Connection error:", error)
        );
        socketRef.current.on("connect_timeout", (timeout) =>
            console.error("Connection timeout:", timeout)
        );

        if (dmId) {
            socketRef.current.emit("joinConversation", { conversationId: dmId });

            socketRef.current.on(
                "createDirectMessage",
                (newMessage: UserDirectMessage) => {
                    if (!conversation.data) return;
                    const messageUser =
                        conversation.data.user1.userId === newMessage.senderId
                            ? conversation.data.user1
                            : conversation.data.user2;
                    const pushedMessage: MessageDm = {
                        avatarUrl: messageUser.avatarUrl,
                        conversationId: newMessage.conversationId,
                        messageId: newMessage.id,
                        username: messageUser.username,
                        senderIsBlocked: conversation.data.isBlocked,
                        senderId: newMessage.senderId,
                        createdAt: newMessage.createdAt,
                        content: newMessage.content,
                    };

                    queryClient.setQueryData<MessageDm[]>(
                        ["allMessages", dmId],
                        (prev) => {
                            if (!prev) return [pushedMessage];
                            return [...prev, pushedMessage];
                        }
                    );
                }
            );
        }
    }, [dmId, conversation.data]);

    const sendMessage = () => {
        if (textAreaValue.trim() && dmId && socketRef.current) {
            const messageData = {
                content: textAreaValue,
                conversationId: dmId,
                senderId: user?.id,
            };

            socketRef.current.emit("createDirectMessage", messageData);

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
            <div
                className="bg-discord-greyple topbar-section border-b border-b-almost-black"
                style={{ borderBottomWidth: "3px" }}
            >
                <div className="w-full flex justify-between items-center">
                    <div className="w-full flex">
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
                            <span className="ml-[20px]">|</span>
                        </div>
                        <div>
                            <button
                                onClick={handleClickPlay}
                                className="ml-4 mt-4 bg-green-500 hover:bg-green-700 rounded-lg py-1 px-3"
                            >
                                Play
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            
            <div className="text-white text-left h-[750px] w-auto ml-[20px] overflow-auto">
                {renderMessages()}
                {/* {renderRealTimeMessages()} */}
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

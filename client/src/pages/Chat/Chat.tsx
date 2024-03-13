import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useNavigate, useParams } from "react-router-dom";
import ModalLayout from "../../UIKit/ModalLayout";
import { UserPopup } from "../../components/ProfilPopUp";
import { useGetUser } from "../../utils/useGetUser";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { NotificationBox } from "../../components/NotificationBox";
import { AllUserDm } from "../../types/allUserDm";
import { MessageDm } from "../../types/messageDm";
import TextArea from "../../UIKit/TextArea";

const Chat = () => {
    const { dmId } = useParams();
    const user = useGetUser();
    const navigate = useNavigate();
    const socketRef = useRef<any>(null);
    const [realTimeMessages, setRealTimeMessages] = useState<MessageDm[]>([]);
    const [textAreaValue, setTextAreaValue] = useState("");

    const allUsers = useQuery({
        queryKey: ["conversationAllUser"],
        queryFn: async () => {
            const res = await axios.get<AllUserDm>(`/api/dm/${dmId}`);
            return res.data;
        },
    });

    const otherUser = allUsers.data
        ? allUsers.data.user1.userId === user?.id
            ? allUsers.data.user2
            : allUsers.data.user1
        : null;

    if (!allUsers.data) {
        return <div>Loading...</div>;
    }

    const allMessages = useQuery<MessageDm[]>({
        queryKey: ["allMessages"],
        queryFn: async (): Promise<MessageDm[]> => {
            if (!dmId) {
                return [];
            }
            const response = await axios.get<MessageDm[]>(`/api/dm/${dmId}/messages`);
            return response.data;
        },
        enabled: !!dmId,
    });

    if (allMessages.isLoading || !allMessages.data) {
        return <div>Loading...</div>;
    }

    useEffect(() => {
        const socket = io("/dm");
        socketRef.current = socket;

        socket.on("connect", () => console.log("Connected to server"));
        socket.on("connect_error", (error) =>
            console.error("Connection error:", error)
        );
        socket.on("connect_timeout", (timeout) =>
            console.error("Connection timeout:", timeout)
        );

        if (dmId) {
            socket.emit("joinConversation", { conversationId: dmId });

            socket.on("getDirectMessages", (newMessages) => {
                console.log("Received new messages:", newMessages);
                setRealTimeMessages((prevMessages) => [
                    ...prevMessages,
                    ...newMessages,
                ]);
            });

            socket.on("createDirectMessage", (newMessage) => {
                console.log("Received new message:", newMessage);
                const newTimestamp = new Date().toISOString();
                const updatedMessage = { ...newMessage, createdAt: newTimestamp };
                setRealTimeMessages((prevMessages) => [
                    ...prevMessages,
                    updatedMessage,
                ]);
                socketRef.current = socket;
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [dmId]);

    useEffect(() => {
        console.log("realTimeMessages updated:", realTimeMessages);
    }, [realTimeMessages]);

    const sendMessage = () => {
        if (textAreaValue.trim() && dmId && socketRef.current) {
            const messageData = {
                content: textAreaValue,
                conversationId: dmId,
                senderId: user?.id,
            };

            socketRef.current.emit("createDirectMessage", messageData);

            setTextAreaValue(""); // Réinitialiser la valeur du TextArea après envoi
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
        if (currentIndex === 0) {
            return true;
        }

        const previousMessage = allMessages.data[currentIndex - 1];
        const currentMessage = allMessages.data[currentIndex];

        return previousMessage.senderId !== currentMessage.senderId;
    };

    const shouldDisplayUsername = (currentIndex: number): boolean => {
        if (currentIndex === 0) {
            return true;
        }

        const previousMessage = allMessages.data[currentIndex - 1];
        const currentMessage = allMessages.data[currentIndex];

        return previousMessage.senderId !== currentMessage.senderId;
    };

    const shouldDisplayAvatarAndTimestampRT = (currentIndex: number): boolean => {
        if (currentIndex === 0) {
            return true;
        }

        const previousMessage = realTimeMessages[currentIndex - 1];
        const currentMessage = realTimeMessages[currentIndex];

        return previousMessage?.senderId !== currentMessage?.senderId;
    };

    const shouldDisplayUsernameRT = (currentIndex: number): boolean => {
        if (currentIndex === 0) {
            return true;
        }

        const previousMessage = realTimeMessages[currentIndex - 1];
        const currentMessage = realTimeMessages[currentIndex];

        return previousMessage?.senderId !== currentMessage?.senderId;
    };

    const renderMessages = () => {
        return (allMessages.data ?? []).map((msg, index) => (
            <div className="mt-[20px]" key={index}>
                <div className="flex">
                    {shouldDisplayAvatarAndTimestamp(index) && (
                        <div className="flex">

                            <Avatar imgUrl={msg.avatarUrl} userId={msg.senderId} size="md" borderRadius={0.5} />
                            {shouldDisplayUsername(index) && (
                                <div className="font-bold ml-[30px]">
                                    {msg.senderId === user?.id
                                        ? user?.username
                                        : otherUser?.username}
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

    const renderRealTimeMessages = () => {
        return realTimeMessages.map((msg, index) => (
            <div className="mt-[20px]" key={index}>
                <div className="flex">
                    {shouldDisplayAvatarAndTimestampRT(index) && (
                        <div className="flex">
                            {msg.avatarUrl ? (
                                <img
                                    src={msg.avatarUrl}
                                    className="h-[50px] w-[50px] rounded-full"
                                />
                            ) : (
                                <img
                                    src={"/default-avatar.png"}
                                    className="h-[50px] w-[50px] rounded-full"
                                />
                            )}
                            {shouldDisplayUsernameRT(index) && (
                                <div className="font-bold ml-[30px]">
                                    {msg.senderId === user?.id
                                        ? user?.username
                                        : otherUser?.username}
                                </div>
                            )}
                        </div>
                    )}

                    {shouldDisplayAvatarAndTimestampRT(index) && (
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
                <div className="mt-[-15px] block text-md ml-[80px]  ">
                    {msg.content}
                </div>
            </div>
        ));
    };

    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const openPopup = () => {
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
    };

    const handleClickPlay = () => {
        navigate("/play");
    };

    if (!dmId) {
        return <div>Please select a conversation to start chatting.</div>;
    }

    console.log("realTimeMessages", realTimeMessages);
    return (
        <div className="w-full bg-discord-light-grey">
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
                                status={otherUser?.status}
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
                    <div>
                        <NotificationBox />
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                {isPopupOpen && otherUser && (
                    <ModalLayout>
                        <UserPopup user={otherUser} onClose={closePopup} />
                    </ModalLayout>
                )}
            </div>
            <div className="text-white text-left h-[750px] w-[1400px] ml-[20px] overflow-auto">
                {renderMessages()}
                {renderRealTimeMessages()}
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

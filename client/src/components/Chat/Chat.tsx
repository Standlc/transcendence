import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Timestamp } from "../../../../api/src/types/schema";
import defaultAvatar from "./../../components/defaultAvatar.png";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useNavigate, useParams } from "react-router-dom";
import ModalLayout from "../../UIKit/ModalLayout";
import { UserPopup } from "../ProfilPopUp";
import { useGetUser } from "../../utils/useGetUser";
import axios from "axios";
import { AppUser } from "@api/types/clientSchema";
import { useQuery } from "@tanstack/react-query";
import { NotificationBox } from "../NotificationBox";

{
    // TODO: Pour l'input chat
    /* <TextArea></TextArea> */
    // search friend input requette pour pas avoir besoin d'appuyer , affiche directement
}

interface AllUser {
    id: 0;
    createdAt: "string";
    user1: {
        userId: 0;
        avatarUrl: "string";
        username: "string";
        rating: 0;
        status: 0;
    };
    user2: {
        userId: 0;
        avatarUrl: "string";
        username: "string";
        rating: 0;
        status: 0;
    };
}

interface Message {
    avatarUrl: string | null;
    content: string;
    conversationId: number;
    createdAt: Timestamp;
    messageId: number;
    senderId: number;
    senderIsBlocked: boolean;
    username: string;
}

interface conversationResponse {
    id: number;
    createdAt: Timestamp;
    user1_id: number;
    user2_id: number;
}

const Chat = () => {
    const { dmId } = useParams();
    const user = useGetUser();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const socketRef = useRef<any>(null);

    console.log("User", user);

    const allUsers = useQuery({
        queryKey: ["conversationAllUser"],
        queryFn: async () => {
            const res = await axios.get<AllUser>(`/api/dm/${dmId}`);
            return res.data;
        },
    });

    // console.log("all users", allUsers.data);

    const otherUser = allUsers.data
        ? allUsers.data.user1.userId === user?.id
            ? allUsers.data.user2
            : allUsers.data.user1
        : null;

    if (!allUsers.data) {
        return <div>Loading...</div>; // Ou une autre gestion de l'état de chargement
    }

    const allMessages = useQuery<Message[]>({
        queryKey: ["allMessages"],
        queryFn: async (): Promise<Message[]> => {
            if (!dmId) {
                return [];
            }
            const response = await axios.get<Message[]>(`/api/dm/${dmId}/messages`);
            return response.data;
        },
        enabled: !!dmId, // Active la requête uniquement si dmId est disponible
    });

    console.log("allMessages", allMessages.data);
    if (allMessages.isLoading || !allMessages.data) {
        return <div>Loading...</div>;
    }

    useEffect(() => {
        const socket = io("/dm");
        socketRef.current = socket;

        // Setup event listeners
        socket.on("connect", () => console.log("Connected to server"));
        socket.on("connect_error", (error) =>
            console.error("Connection error:", error)
        );
        socket.on("connect_timeout", (timeout) =>
            console.error("Connection timeout:", timeout)
        );

        if (dmId) {
            socket.emit("joinConversation", {
                conversationId: dmId,
            });
            socket.on("joinConversation", (data) =>
                console.log(`Joined conversation successfully`, data)
            );
        }

        return () => {
            socket.disconnect();
        };
    }, [dmId, user?.id]);

    const sendMessage = (e) => {
        e.preventDefault();

        if (message.trim() && dmId && socketRef.current) {
            const messageData = {
                content: message, // Use the state variable here
                conversationId: dmId,
                senderId: user?.id,
            };

            socketRef.current.emit("createDirectMessage", messageData);

            setMessage("");
        }
    };

    const shouldDisplayAvatarAndTimestamp = (currentIndex: number): boolean => {
        if (currentIndex === 0) {
            return true;
        }

        const previousMessage = allMessages.data[currentIndex - 1];
        const currentMessage = allMessages.data[currentIndex];

        // Vérifie si le message précédent est du même expéditeur
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
            <div className="text-white text-left h-[800px] w-[1400px] ml-[20px] overflow-auto">
                {allMessages.data.map((msg, index) => (
                    <div className="mt-[20px]  " key={index}>
                        <div className="flex ">
                            {shouldDisplayAvatarAndTimestamp(index) && (
                                <div className="flex ">
                                    {msg.avatarUrl ? (
                                        <img
                                            src={msg.avatarUrl}
                                            className="h-[50px] w-[50px] rounded-full"
                                        />
                                    ) : (
                                        <img
                                            src={defaultAvatar}
                                            className="h-[50px] w-[50px] rounded-full"
                                        />
                                    )}
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
                        <div className="mt-[-15px] block text-md ml-[80px]">
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="chat-input-form">
                <input
                    className="chat-input text-black w-full h-12 px-4"
                    type="text"
                    value={message} // Bind the state to the input
                    onChange={(e) => setMessage(e.target.value)} // Update the state on change
                    placeholder="Write a message..."
                />
                <button type="submit" className="send-message-btn">
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;

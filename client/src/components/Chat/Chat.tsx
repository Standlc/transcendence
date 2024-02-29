import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../RequireAuth/AuthProvider";
import { Avatar } from "../../UIKit/Avatar";
import { Timestamp } from "../../../../api/src/types/schema";
import defaultAvatar from "./../../components/defaultAvatar.png";
import TextArea from "../../UIKit/TextArea";

interface Props {
    SERVER_URL: string;
    conversationID: number | null;
    selectedFriend: {
        id: number | undefined;
        username: string;
        avatarUrl: string | null;
    } | null;
}

{
    // TODO: Pour l'input chat
    /* <TextArea></TextArea> */
    // search friend input requette pour pas avoir besoin d'appuyer , affiche directement
}

interface Popuser {
    user: UserProfile | null;
    onClose: () => void;
}

const UserPopup: React.FC<Popuser> = ({ user, onClose }: Popuser) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="h-full w-full rounded-lg overflow-hidden">
            <div className="flex rounded-top-lg bg-discord-light-black w-full h-[100px]"></div>
            <div className="flex bg-discord-light-grey items-center justify-between w-full">
                <div className="ml-[40px] mt-[10px] mb-[20px]">
                    <Avatar
                        imgUrl={user?.avatarUrl}
                        size="2xl"
                        userId={user?.id ?? 0}
                    />
                </div>
                <div className="flex items-center">
                    {" "}
                    {/* Utilisation d'un conteneur flex pour aligner les éléments */}
                    <div className="bg-green py-2 rounded-lg px-3 block mr-2">
                        {" "}
                        {/* Ajout de mr-2 pour l'espacement */}
                        <button>Send message</button>
                    </div>
                    <div className="relative">
                        <button onClick={toggleMenu}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7 text-gray-400 hover:text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <circle cx="12" cy="5" r="3" />
                                <circle cx="12" cy="12" r="3" />
                                <circle cx="12" cy="19" r="3" />
                            </svg>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-8 bg-discord-black rounded-lg shadow-md border border-gray-200">
                                <button className="block px-4 py-2 w-full text-left hover:bg-discord-light-grey">
                                    Supprimer
                                </button>
                                <button className="block px-4 py-2 w-full text-left hover:bg-discord-light-grey">
                                    Envoyer un message
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className=" bg-discord-light-grey h-full">
                <div className="bg-discord-black mr-[10px] rounded-lg ml-[10px] h-[300px]">
                    <div className="text-left ml-[20px] text-xl font-bold">
                        <div> {user?.username}</div>
                        <div> elo : {user?.rating}</div>
                        <div> {user?.bio}</div>
                    </div>
                </div>
                <button onClick={onClose}>on close</button>
            </div>
        </div>
    );
};

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

interface UserProfile {
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Timestamp;
    email: string | null;
    firstname: string | null;
    id: number;
    lastname: string | null;
    rating: number;
    username: string | null;
}

const Chat: React.FC<Props> = ({
    conversationID,
    selectedFriend,
    SERVER_URL,
}: Props) => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const { loginResponse } = useAuth();
    const socketRef = useRef<any>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [friendProfile, setProfile] = useState<UserProfile | null>(null);

    const getUserProfile = async (id: number) => {
        try {
            const response = await fetch(
                `http://localhost:3000/api/users/${id}/profile`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // Check if the response is JSON before parsing
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                setProfile(data);
                console.log("Profile data", data);
            } else {
                // Handle non-JSON responses or errors differently
                console.error("Received non-JSON response from server");
                // Optionally, read the response as text to log or handle it
                const textResponse = await response.text();
                console.log("Server response:", textResponse);
                throw new Error("Server returned a non-JSON response");
            }
        } catch (error) {
            console.error("Fetching profile failed:", error);
        }
    };

    useEffect(() => {
        if (selectedFriend) {
            getUserProfile(selectedFriend.id);
        }

        if (conversationID) {
            socketRef.current = io(SERVER_URL + "/dm");

            socketRef.current.on("connect", () => {
                console.log("Connected to server");
            });

            console.log("Socket id", socketRef.current);

            socketRef.current.on("connect_error", (error) => {
                console.error("Connection error:", error);
            });

            socketRef.current.on("connect_timeout", (timeout) => {
                console.error("Connection timeout:", timeout);
            });

            socketRef.current.emit("joinConversation", {
                conversationId: conversationID,
                userId: loginResponse?.id,
            });

            socketRef.current.on("joinedConversation", (data) => {
                console.log(`Joined conversation successfully`, data);
            });

            return () => {
                socketRef.current.disconnect();
            };
        }
    }, [conversationID, SERVER_URL, selectedFriend]);

    useEffect(() => {
        const getFullConversation = async () => {
            if (!conversationID) return;

            try {
                const response = await fetch(
                    `http://localhost:3000/api/dm/${conversationID}/messages`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // Assuming the API response is directly in the format we need
                setMessages(data);
                console.log("Messages", data);
            } catch (error) {
                console.error("Fetching conversation failed:", error);
            }
        };

        getFullConversation();
    }, [conversationID]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (message.trim() && conversationID && socketRef.current) {
            const messageData = {
                content: message,
                conversationId: conversationID,
                senderId: loginResponse?.id,
            };

            socketRef.current.emit("createDirectMessage", messageData);

            socketRef.current.emit("joinConversation", {
                conversationId: conversationID,
                userId: loginResponse?.id,
            });

            setMessage("");
        }
    };

    const openPopup = () => {
        setIsPopupOpen(true);
    };

    // Fonction pour fermer la popup
    const closePopup = () => {
        setIsPopupOpen(false);
    };

    if (!conversationID) {
        return <div>Please select a conversation to start chatting.</div>;
    }

    const shouldDisplayAvatarAndTimestamp = (currentIndex: number): boolean => {
        if (currentIndex === 0) {
            // Le premier message doit toujours afficher l'avatar et l'horodatage
            return true;
        }

        const previousMessage = messages[currentIndex - 1];
        const currentMessage = messages[currentIndex];

        // Vérifie si le message précédent est du même expéditeur
        return previousMessage.senderId !== currentMessage.senderId;
    };

    const shouldDisplayUsername = (currentIndex: number): boolean => {
        if (currentIndex === 0) {
            return true;
        }

        const previousMessage = messages[currentIndex - 1];
        const currentMessage = messages[currentIndex];

        return previousMessage.senderId !== currentMessage.senderId;
    };

    return (
        <div className="w-full">
            <div
                className="bg-discord-greyple topbar-section border-b border-b-almost-black"
                style={{ borderBottomWidth: "3px" }}
            >
                <div className="flex item-center mt-[10px] ml-[20px]">
                    <Avatar
                        imgUrl={selectedFriend?.avatarUrl}
                        size="md"
                        userId={selectedFriend?.id ?? 0}
                    />
                </div>
                <div className="ml-2 mt-4 font-bold text-xl">
                    <button onClick={openPopup}>{selectedFriend?.username}</button>
                    <span className="ml-[20px]">|</span>
                </div>
            </div>
            <div className="flex w-[200px] justify-center">
                {isPopupOpen && (
                    <div className="fixed top-0 left-0 w-full h-full flex justify-center bg-black bg-opacity-[30%] z-10    items-center">
                        <div className="bg-gray w-[600px] h-[650px] rounded-md shadow-lg ">
                            <UserPopup user={friendProfile} onClose={closePopup} />
                        </div>
                    </div>
                )}
            </div>
            <div className="text-white text-left h-[800px] w-[1400px] ml-[20px] overflow-auto">
                {messages.map((msg, index) => (
                    <div className="mt-[20px]  " key={index}>
                        <div className="flex ">
                            {shouldDisplayAvatarAndTimestamp(index) && (
                                <div className="flex">
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
                                            {msg.senderId === loginResponse?.id
                                                ? loginResponse?.username
                                                : selectedFriend?.username}{" "}
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
            <form onSubmit={sendMessage}>
                <input
                    className="text-black w-[800px] h-[50px] bg-gray  ml-[20px]"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default Chat;

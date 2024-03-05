import { useNavigate } from "react-router-dom";
import { LoginResponse } from "./RequireAuth/AuthProvider";
import defaultAvatar from "./defaultAvatar.png";
import React, { useEffect, useState } from "react";
import { Settings } from "@mui/icons-material";
import { PutAvatar } from "./PutAvatar";
import { Avatar } from "../UIKit/avatar/Avatar";
import { Collapsible } from "./Collapsible";

interface Props {
    loginResponse: LoginResponse | null;
    setCurrentPage: (page: string, timestamp: number) => void; // Ajouter un deuxième paramètre
    setConversationID: (conversationID: number) => void;
    setSelectedFriend: (
        friend: { id: number; username: string; avatarUrl: string | null } | null
    ) => void;
}

interface Conversation {
    createdAt: string;
    id: number;
    user1: {
        userId: number;
        username: string;
        avatarUrl: string | null;
    };
    user2: {
        userId: number;
        username: string;
        avatarUrl: string | null;
    };
}
export const ChanColumn: React.FC<Props> = ({
    loginResponse,
    setCurrentPage,
    setConversationID,
    setSelectedFriend,
}: Props) => {
    const navigate = useNavigate();
    const [allConversation, setallConversation] = useState<Conversation[]>([]);
    const [activeButton, setActiveButton] = useState<number | null>(null);

    const handleChatClick = () => {
        setCurrentPage("chatbox", Date.now());
    };

    const handleButtonClick = (index: number) => {
        if (index === -1) {
            handleFriendsClick();
            setActiveButton(index);
        } else {
            const conversation = allConversation[index];
            setConversationID(conversation.id);
            handleChatClick();
            setActiveButton(index);
        }
    };

    const handleFriendsClick = () => {
        setCurrentPage("friends", Date.now());
        setActiveButton(-1);
    };

    const handleSettingClick = () => {
        navigate("/settings");
    };

    const getAllConversation = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/dm", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setallConversation(data);
            console.log(data);
        } catch (error) {
            console.error("Fetching friends failed:", error);
        }
    };

    useEffect(() => {
        getAllConversation();
    }, []);

    const whichUsername = (conv: Conversation) => {
        if (conv.user1.userId === loginResponse?.id) {
            return conv.user2.username;
        } else {
            return conv.user1.username;
        }
    };

    const whichAvatar = (conv: Conversation) => {
        if (conv.user1.userId === loginResponse?.id) {
            if (conv.user2.avatarUrl !== null) {
                return conv.user2.avatarUrl;
            }
        } else {
            if (conv.user1.avatarUrl !== null) {
                return conv.user1.avatarUrl;
            }
        }
        return defaultAvatar;
    };

    const whichID = (conv: Conversation) => {
        if (conv.user1.userId === loginResponse?.id) {
            return conv.user2.userId;
        } else {
            return conv.user1.userId;
        }
    };

    return (
        <div className="bg-not-quite-black chan-column">
            <div
                className="bg-not-quite-black topbar-section border-b border-b-almost-black "
                style={{ borderBottomWidth: "3px" }}
            ></div>
            <div className="w-full item-center justify-center">
                <div
                    onClick={() => handleButtonClick(-1)}
                    className={`cell-chan text-xl align-center hover:bg-discord-light-grey hover:rounded-lg rounded-lg ml-6 mt-1${
                        activeButton === -1
                            ? " bg-discord-light-grey"
                            : " bg-not-quite-black"
                    }`}
                    style={{ cursor: "pointer" }}
                >
                    <svg
                        aria-hidden="true"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        width="35"
                        height="35"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"
                        ></path>
                        <path
                            fill="currentColor"
                            d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        ></path>
                    </svg>
                    <div className="ml-6 mt-1">
                        <button>Amis</button>
                    </div>
                </div>
            </div>
            <div className="cell-chan font-bold text-greyple hover:text-white hover:rounded-md text-sm text-left flex items-center justify-between">
                <div className="flex block">MESSAGE PRIVÉS</div>

                <span className="bloc text-right">+</span>
            </div>
            <div className="ml-5 mt-2 text-left ">
                <Collapsible title="">
                    {allConversation.map((conv, index) => (
                        <button
                            key={index}
                            className={`mb-5 flex hover:bg-discord-light-grey py-2 rounded-lg w-[280px] ${
                                activeButton == index
                                    ? "bg-discord-light-grey"
                                    : "bg-not-quite-black"
                            }`}
                            onClick={() => {
                                const otherUserId = whichID(conv);
                                const otherUsername = whichUsername(conv);
                                const otherUserAvatarUrl = whichAvatar(conv);

                                setConversationID(conv.id);
                                setSelectedFriend({
                                    id: otherUserId,
                                    username: otherUsername,
                                    avatarUrl: otherUserAvatarUrl,
                                });
                                setCurrentPage("chatbox", Date.now());
                                setActiveButton(index);
                            }}
                        >
                            <Avatar
                                imgUrl={whichAvatar(conv)}
                                size="md"
                                userId={whichID(conv)}
                            />
                            <div className="ml-5">{whichUsername(conv)}</div>
                        </button>
                    ))}
                </Collapsible>
            </div>
            <div className="flex bg-almost-black text-m user-chancolumn items-center justify-between">
                <div className="flex items-center">
                    {/* <PutAvatar loginResponse={loginResponse} /> */}
                    <Avatar
                        imgUrl={loginResponse?.avatarUrl}
                        size="md"
                        userId={loginResponse?.id ?? 0}
                        // status={}
                        borderRadius={0.5}
                    />
                    <div className="ml-[10px]">
                        <div className="font-bold text-left ">
                            {loginResponse?.username}
                        </div>
                        <div className="text-green text-left">En ligne</div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        className="text-right mr-[10px] px-2"
                        onClick={handleSettingClick}
                    >
                        <Settings />
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from "react";
import defaultAvatar from "../components/defaultAvatar.png";
import Chat from "../components/Chat/Chat";
import { Avatar } from "../UIKit/Avatar";

interface Props {
    allFriends: boolean;
    setAdding: (adding: boolean) => void;
    setFriendsPending: (friendsPending: boolean) => void;
    setAllFriends: (allFriends: boolean) => void;
    friends: Friend[];
    SERVER_URL: string;
}

interface Friend {
    username: string;
    avatarUrl: string;
    id: number;
}

interface Conversation {
    userId: number;
}

export const AllFriends: React.FC<Props> = ({
    allFriends,
    setAdding,
    setFriendsPending,
    setAllFriends,
    friends,
    SERVER_URL,
}: Props) => {
    const [showChat, setShowChat] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<number>(0);

    const newConversation = async (userId: number) => {
        try {
            const response = await fetch("http://localhost:3000/api/dm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
            });
            console.log(JSON.stringify({ userId }));
            if (response.ok) {
                const data = await response.json();
                console.log("Conv created:", data);
                setConversations([...conversations, data]); // Ajouter la nouvelle conversation à l'état des conversations
                setShowChat(true); // Afficher la conversation après la création
            } else {
                console.error("Conv failed ", response.status);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const delFriends = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:3000/api/friends?id=${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.text();
                console.log("Friends deleted:", data);
            } else {
                console.error("Friends failed delete", response.status);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const findConversation = async (friendId: number) => {
        try {
            const response = await fetch(
                `http://localhost:3000/api/findDmId/${friendId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                // Supposons que la réponse contienne l'ID de la conversation si trouvée

                setSelectedConversation(data.conversationId);
                console.log("Conversation found:", data);
                setShowChat(true);
                setSelectedFriend(
                    friends.find((friend) => friend.id === friendId) || null
                );
            } else if (response.status === 404) {
                // Aucune conversation trouvée, créez-en une nouvelle
                newConversation(friendId);
            } else {
                // Gérer d'autres réponses inattendues
                console.error(
                    "Erreur lors de la recherche de la conversation:",
                    response.status
                );
            }
        } catch (error) {
            console.error("Erreur lors de la recherche de la conversation:", error);
        }
    };

    const handleFriendClick = (friend: Friend) => {
        console.log("Friend clicked:", friend);
        findConversation(friend.id);
    };

    const handleDeleteClick = (friend: Friend) => {
        console.log("Friend clicked:", friend);
        delFriends(friend.id);
    };

    console.log("SELECTEDFRIEND", selectedFriend);
    return (
        <>
            {showChat ? (
                <Chat
                    SERVER_URL={SERVER_URL}
                    conversationID={selectedConversation}
                    selectedFriend={selectedFriend}
                />
            ) : (
                <div>
                    <div
                        className="bg-discord-greyple topbar-section border-b border-b-almost-black"
                        style={{ borderBottomWidth: "3px" }}
                    >
                        <svg
                            className="ml-4 mt-3"
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
                        <div className="ml-2 mt-4 font-bold text-xl ">
                            Amis <span className="ml-[20px] text-greyple">|</span>
                        </div>
                        <div className="flex ml-[20px] mt-[10px] mb-[10px]">
                            <button
                                className={`text-white mr-[20px] text-s py-1 text-center p-[10px] ${
                                    allFriends
                                        ? "bg-discord-light-grey text-green"
                                        : "hover:bg-discord-light-grey"
                                } p-[10px] rounded-lg text-s  text-center`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => {
                                    setFriendsPending(true);
                                    setAllFriends(false);
                                }}
                                className="mr-[20px] text-white p-[10px] hover:bg-discord-light-grey rounded-lg text-s  py-1 text-center"
                            >
                                En attente
                            </button>
                            <button
                                onClick={() => {
                                    setAdding(true);
                                    setAllFriends(false);
                                }}
                                className="text-white bg-green p-[10px]  rounded-lg text-s py-2 text-center"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                    <div className="relative mt-5 ml-5 mr-5">
                        <input
                            type="text"
                            placeholder="Rechercher"
                            className="block w-full py-3 px-4 bg-discord-black text-xl rounded"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-4.35-4.35"
                                ></path>
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15.5 10.5a5 5 0 1 1-8.44-3.5"
                                ></path>
                            </svg>
                        </div>
                    </div>
                    <div className="block p-5 text-left  text-m font-bold">
                        EN LIGNE - 2
                    </div>
                    <div className="border-b border-b-gray-500 border-t-1 " />
                    <div className="mt-5">
                        <ul>
                            {friends.map((friend) => (
                                <div
                                    onClick={() => handleFriendClick(friend)}
                                    className="flex item-center justify-between ml-5 mb-4 py-2 hover:bg-discord-light-grey  rounded-lg mb-[10px]"
                                    style={{ cursor: "pointer" }}
                                    key={friend.id}
                                >
                                    <div className="flex items-center">
                                        <li>
                                            <button className="  text-left text-m font-bold ml-[10px]">
                                                {friend.avatarUrl ? (
                                                    <Avatar
                                                        imgUrl={friend.avatarUrl}
                                                        size="lg"
                                                        userId={friend.id}
                                                    />
                                                ) : (
                                                    <Avatar
                                                        imgUrl={defaultAvatar}
                                                        size="lg"
                                                        userId={friend.id}
                                                    />
                                                )}
                                            </button>
                                        </li>
                                        <div className="ml-5">
                                            <div className="font-bold">
                                                {friend.username}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClick(friend)}
                                        className="bg-blurple hover:bg-blurple-hover text-white font-bold py-2 px-4 rounded mr-[10px] "
                                    >
                                        supprimer
                                    </button>
                                </div>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

import React, { useState, useEffect } from "react";
import { Chat } from "../components/Chat/Chat";
import { FriendsAdd } from "./FriendsAdd";

// Assuming the Friend interface is defined as follows:
interface Friend {
    id: number;
    name: string;
    createdAt: string;
}

export const Friends = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [showChat, setShowChat] = useState(false);
    const [adding, setAdding] = useState(false);

    // useEffect(() => {
    //     const fetchFriends = async () => {
    //         try {
    //             const response = await fetch("/api/friends"); // Adjust the API endpoint as needed
    //             if (!response.ok) {
    //                 throw new Error(`HTTP error! status: ${response.status}`);
    //             }
    //             const data = await response.json();
    //             setFriends(data); // Store the friends data in state
    //         } catch (error) {
    //             console.error("Could not fetch friends data:", error);
    //         }
    //     };
    //     fetchFriends();
    // }, []); // Empty dependency array means this effect will only run once, when the component mounts

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                // Simulated API call
                setTimeout(() => {
                    const mockFriendsData: Friend[] = [
                        { id: 1, name: "John Doe", createdAt: "2024-02-14T12:00:00Z" },
                        {
                            id: 2,
                            name: "Jane Smith",
                            createdAt: "2024-02-15T12:00:00Z",
                        },
                        // Add more friends as needed
                    ];
                    setFriends(mockFriendsData);
                }, 1000); // Simulate fetch delay
            } catch (error) {
                console.error("Could not fetch friends data:", error);
            }
        };

        fetchFriends();
    }, []);

    return (
        <div className="w-full">
            {showChat ? (
                <Chat />
            ) : adding ? (
                <FriendsAdd adding={adding} />
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
                        <div className="ml-2 mt-4 font-bold text-xl ">Amis</div>
                        <div className="ml-[100px]  mt-[15px]">
                            <button
                                onClick={() => setAdding(true)}
                                className="text-white bg-green p-[10px]  rounded-lg text-s w-full py-1 text-center"
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
                    <ul className="w-full p-5">
                        {friends.map((friend) => (
                            <li key={friend.id}>
                                <button
                                    onClick={() => setShowChat(true)} // When a friend's name is clicked, show the chat
                                    className=" py-2  hover:bg-gray-800 w-full text-left text-m font-bold"
                                >
                                    [avatar] {friend.name}
                                    <span className=""> [bio]</span>
                                    <span className="text-right mr-5 block">
                                        <button>supprimer</button>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

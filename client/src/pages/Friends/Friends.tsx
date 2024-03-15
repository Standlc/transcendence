import React, { useState, useEffect } from "react";
import { FriendsAdd } from "./FriendsAdd";
import { FriendsInvitation } from "./FriendsInvitation";
import { AllFriends } from "./AllFriends";
import axios from "axios";
import { useGetUser } from "../../utils/useGetUser";
import { Friend } from "../../types/friend";

type FriendsList = Friend[];

const fetchFriends = async (userId: number) => {
    const response = await axios.get(`http://localhost:3000/api/friends?id=${userId}`);
    return response.data;
};



export const Friends: React.FC = () => {
    const [adding, setAdding] = useState(false);
    const [friends, setFriends] = useState<FriendsList>([]);
    const [friendsPending, setFriendsPending] = useState(false);
    const [allFriends, setAllFriends] = useState(true);
    const user = useGetUser();
    
 

    // const { data: friends, isLoading, isError } = useQuery<Friend[]>({
    //     queryKey: ["allFriends", userId],
    //     queryFn: async () => {
    //         try {
    //             const response = await axios.get(`/api/friends?id=${userId}`);
    //             return response.data;
    //         } catch (error) {
    //             throw new Error("Failed to fetch friend list");
    //         }
    //     },
    // });

    


    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3000/api/friends?id=${user?.id}`,
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
                setFriends(data);
                console.log("Friendslist", data);
            } catch (error) {
                console.error("Fetching friends failed:", error);
            }
        };

        if (user?.id) {
            fetchFriends();
        }
    }, [user?.id]);
    if (!user) return null;

    return (
        <div className="w-full">
            {adding ? (
                <FriendsAdd
                    adding={adding}
                    setAdding={setAdding}
                    setFriendsPending={setFriendsPending}
                    setAllFriends={setAllFriends}
                />
            ) : friendsPending ? (
                <FriendsInvitation
                    friendsPending={friendsPending}
                    setAdding={setAdding}
                    setFriendsPending={setFriendsPending}
                    setAllfriends={setAllFriends}
                />
            ) : allFriends ? (
                <AllFriends
                    loginResponse={user}
                    allFriends={allFriends}
                    setAdding={setAdding}
                    setFriendsPending={setFriendsPending}
                    setAllFriends={setAllFriends}
                    friends={friends}
                />
            ) : (
                <div className="">
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
                            Friends <span className="ml-[20px] text-greyple">|</span>
                        </div>

                        <div className="flex ml-[20px]  mt-[10px] mb-[10px]">
                            <button
                                onClick={() => setAllFriends(true)}
                                className="mr-[20px] text-white p-[10px] hover:bg-discord-light-grey rounded-lg text-s  py-1 text-center"
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFriendsPending(true)}
                                className="mr-[20px] text-white p-[10px] hover:bg-discord-light-grey rounded-lg text-s  py-1 text-center"
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setAdding(true)}
                                className="text-white bg-green p-[10px]  rounded-lg text-s py-2 text-center"
                            >
                                ADD
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import { useEffect, useState } from "react";

import { Avatar } from "../../UIKit/avatar/Avatar";
interface Props {
    friendsPending: boolean;
    setAdding: (adding: boolean) => void;
    setFriendsPending: (friendsPending: boolean) => void;
    setAllfriends: (allFriends: boolean) => void;
}

interface Friend {
    username: string;
    avatarUrl: string;
    id: number;
}

export const FriendsInvitation: React.FC<Props> = ({
    friendsPending,
    setAdding,
    setFriendsPending,
    setAllfriends,
}: Props) => {
    const [friendsRequest, setFriendsRequest] = useState<Friend[]>([]);

    useEffect(() => {
        const fetchFriendsRequest = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3000/api/friends/request`,
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
                setFriendsRequest(data);
                console.log(data);
            } catch (error) {
                console.error("Fetching friends failed:", error);
            }
        };

        fetchFriendsRequest();
    }, []);

    const acceptRequest = async (id: number) => {
        try {
            const response = await fetch(
                `http://localhost:3000/api/friends/accept?id=${id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.ok) {
                // Si l'ami a été accepté avec succès, filtrez-le hors de l'état local
                setFriendsRequest((currentFriendsRequest) =>
                    currentFriendsRequest.filter((friend) => friend.id !== id)
                );
                console.log("Friend accepted:", await response.json());
            } else {
                console.error("Friend accept failed: ", response.status);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    console.log("friends request", friendsRequest);
    return (
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

                <div className="flex ml-[20px]  mt-[10px] mb-[10px]">
                    <button
                        onClick={() => {
                            setFriendsPending(false);
                            setAllfriends(true);
                        }}
                        className="mr-[20px] text-white p-[10px] hover:bg-discord-light-grey rounded-lg text-s  py-1 text-center"
                    >
                        Tous
                    </button>
                    <button
                        className={`text-white mr-[20px] text-s py-1 text-center p-[10px] ${
                            friendsPending
                                ? "bg-discord-light-grey text-green"
                                : "hover:bg-discord-light-grey"
                        } p-[10px] rounded-lg text-s  text-center`}
                    >
                        En attente
                    </button>
                    <button
                        onClick={() => {
                            setAdding(true);
                            setFriendsPending(false);
                        }}
                        className="text-white bg-green p-[10px] py-2 rounded-lg text-s  text-center"
                    >
                        Ajouter
                    </button>
                </div>
            </div>
            <div>
                <div className="text-left mt-5 ml-5 font-bold">PENDING INVTATION</div>
            </div>
            <div className="mt-5">
                {friendsRequest.map((friend, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between ml-5 mb-4"
                    >
                        <div className="flex items-center">
                            <Avatar
                                imgUrl={friend.avatarUrl || "/defaultAvatar.png"}
                                size="lg"
                                userId={friend.id}
                            />
                            <div className="ml-5">
                                <div className="font-bold">{friend.username}</div>
                                <div>{friend.username}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => acceptRequest(friend.id)}
                            className="bg-blurple hover:bg-blurple-hover text-white font-bold py-2 px-4 rounded mr-5"
                        >
                            Accepter
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

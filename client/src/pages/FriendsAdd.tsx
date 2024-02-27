import { useState } from "react";
import { LoginResponse } from "../components/RequireAuth/AuthProvider";
import { Avatar } from "../UIKit/Avatar";
import defaultAvatar from "../components/defaultAvatar.png";
interface Props {
    adding: boolean;
    setFriendsPending: (friendsPending: boolean) => void;
    setAdding: (adding: boolean) => void;
    setAllFriends: (allFriends: boolean) => void;
}

export const FriendsAdd: React.FC<Props> = ({
    adding,
    setFriendsPending,
    setAdding,
    setAllFriends,
}: Props) => {
    const [username, setUsername] = useState("");
    const [usersFound, setUsersFound] = useState<LoginResponse[]>([]);

    const add = async (userId: number) => {
        try {
            const response = await fetch(
                `http://localhost:3000/api/friends/request?id=${userId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.ok) {
                const data = await response.text();
                console.log("Friend request sent:", data);
                // Vous pouvez mettre à jour l'UI ici pour refléter le succès de l'ajout
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const findUser = async () => {
        const encodedUsername = encodeURIComponent(username);
        try {
            const response = await fetch(
                `http://localhost:3000/api/users/find?name=${encodedUsername}`
            );
            if (response.ok) {
                const data = await response.json();
                setUsersFound(data);
                console.log("Data received:", data);
                // Handle the received data as needed
            } else {
                console.error("Failed to fetch data:", response.status);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    console.log("users", usersFound);
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
                            setAllFriends(true);
                            setAdding(false);
                        }}
                        className="mr-[20px] text-white p-[10px] hover:bg-discord-light-grey rounded-lg text-s  py-1 text-center"
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => {
                            setFriendsPending(true);
                            setAdding(false);
                        }}
                        className="mr-[20px] text-white p-[10px] hover:bg-discord-light-grey rounded-lg text-s  py-1 text-center"
                    >
                        En attente
                    </button>
                    <button
                        className={`${
                            adding ? "bg-transparent text-green" : "bg-green"
                        } p-[10px]  rounded-lg text-s py-1 text-center`}
                    >
                        Ajouter
                    </button>
                </div>
            </div>
            <div>
                <div className="text-left mt-5 ml-5 font-bold">AJOUTER</div>
                <div className="text-left mt-4 ml-5">
                    Tu peux ajouter des amis grace a leur noms d'ulisateur Discord.
                </div>
                <div className="relative mt-5 ml-5 mr-5">
                    <input
                        type="text"
                        placeholder="Tu peux ajouter des amis grace a leur noms d'ulisateur Discord."
                        className="block w-full py-3 px-4 bg-discord-black text-xl rounded"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 ">
                        <button
                            onClick={findUser}
                            className="text-white bg-blurple  p-[50px] hover:bg-blurple-hover font-bold rounded-lg text-s w-full py-2.5 text-center"
                        >
                            Chercher
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-5">
                {usersFound.map((user, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between ml-5 mb-4"
                    >
                        <div className="flex items-center">
                            {user.avatarUrl ? (
                                <Avatar
                                    imgUrl={user.avatarUrl}
                                    size="lg"
                                    userId={user.id}
                                />
                            ) : (
                                <Avatar
                                    imgUrl={defaultAvatar}
                                    size="lg"
                                    userId={user.id}
                                />
                            )}
                            <div className="ml-5">
                                <div className="font-bold">{user.username}</div>
                                <div>
                                    {user.firstname} {user.lastname}
                                </div>

                                <div className="bg-green rounded-lg"></div>
                            </div>
                            <div> Bio {user.bio} </div>
                        </div>
                        <button
                            onClick={() => add(user.id)}
                            className="bg-blurple hover:bg-blurple-hover text-white font-bold py-2 px-4 rounded mr-5"
                        >
                            Ajouter
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

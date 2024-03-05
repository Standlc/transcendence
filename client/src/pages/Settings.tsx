import { useNavigate } from "react-router-dom";
import defaultAvatar from "../components/defaultAvatar.png";
import { useEffect, useState } from "react";
import { ConfirmAvatarPopUp } from "../components/ConfirmAvatarPopUp";
import { AppUser } from "@api/types/clientSchema";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    user: AppUser;
}

export const Settings: React.FC<Props> = ({ user }: Props) => {
    const [showConfirmAvatarPopup, setShowConfirmAvatarPopup] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();
    const [nickname, setNickname] = useState(user?.username);
    const [firstname, setFirstname] = useState(user?.firstname);
    const [lastname, setLastname] = useState(user?.lastname);

    const handleClickChangeAvatar = () => {
        setShowConfirmAvatarPopup(true);
    };

    const handleFileChange = (file) => {
        setSelectedFile(file);
    };

    const handleConfirmChange = () => {
        // Logique pour soumettre le fichier sélectionné au serveur
        setShowConfirmAvatarPopup(false);
    };

    const handleCancelChange = () => {
        setShowConfirmAvatarPopup(false);
    };

    // const logout = async () => {
    //     const response = await fetch("http://localhost:3000/api/auth/logout");
    //     console.log("LOGOUT", response);
    //     navigate("/");
    // };

    const queryClient = useQueryClient();

    const logout = async () => {
        try {
            await axios.get("/api/auth/logout");

            localStorage.removeItem("token");
            queryClient.invalidateQueries({ queryKey: ["user"] });
        } catch (error) {
            console.error("Erreur lors de la déconnexion", error);
        }
        queryClient.setQueryData(["user"], null);
        navigate("/", { replace: true });
    };

    const handleCloseClick = () => {
        navigate("/home");
    };

    return (
        <div className="flex w-full">
            {/* Section des champs d'entrée à gauche */}
            <div className="ml-[300px] mt-20 w-[400px] mr-[100px]">
                <div className="text-xl font-bold text-left ml-10 mb-20">Profil</div>
                <div className="mb-6 w-[250px]">
                    <label
                        htmlFor="nickname"
                        className="text-left  mb-2 text-sm text-white"
                    >
                        NICKNAME
                    </label>
                    <input
                        type="nickname"
                        id="nickname"
                        value={user?.username}
                        onChange={(e) => setNickname(e.target.value)}
                        className="bg-discord-light-black text-white text-sm rounded-l block w-full h-10 px-2.5"
                        placeholder=""
                    />
                </div>
                <div className="mb-6  w-[250px]">
                    <label
                        htmlFor="FIRSTNAME"
                        className="text-left font-bold block mb-2 text-sm text-white"
                    >
                        FIRSTNAME
                    </label>
                    <input
                        type="FIRSTNAME"
                        id="FIRSTNAME"
                        value={user?.firstname ?? ""}
                        onChange={(e) => setFirstname(e.target.value)}
                        className="bg-discord-light-black text-white text-sm rounded-l block w-full h-10 px-2.5"
                        placeholder=""
                    />
                </div>
                <div className="mb-6  w-[250px]">
                    <label
                        htmlFor="LASTNAME"
                        className="text-left font-bold block mb-2 text-sm text-white"
                    >
                        LASTNAME
                    </label>
                    <input
                        type="LASTNAME"
                        id="LASTNAME"
                        value={user?.lastname ?? ""}
                        onChange={(e) => setLastname(e.target.value)}
                        className="bg-discord-light-black text-white text-sm rounded-l block w-full h-10 px-2.5"
                        placeholder=""
                    />
                </div>
                <div className="text-left">
                    <button
                        onClick={handleClickChangeAvatar}
                        className="bg-blurple hover:bg-blurple-hover text-white text-sm rounded-lg h-10 py-2 px-2.5"
                    >
                        CHANGE AVATAR
                    </button>
                    <button className="ml-10 hover:underline">Delete Avatar</button>
                </div>
                <div className="mt-20 text-left">
                    <button
                        onClick={() => logout()}
                        className="bg-red-500 hover:bg-red-700  rounded-lg py-2 px-2.5"
                    >
                        LOG OUT
                    </button>
                </div>
            </div>

            {/* Section des informations de l'utilisateur à droite */}
            <div className="flex-1">
                <div className="items-center justify-center h-full">
                    <div className="mt-20">
                        <button onClick={handleCloseClick}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2" // Change from stroke-width to strokeWidth
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </button>
                    </div>
                    <div className="rounded-b-xl settings-account bg-discord-black flex flex-col items-center justify-center p-4 mt-20">
                        <div className="flex flex-row items-center">
                            <div className="rounded-full bg-greyple p-1">
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt="avatar"
                                        className="rounded-full w-32 h-32"
                                    />
                                ) : (
                                    <img
                                        src={defaultAvatar}
                                        alt="avatar"
                                        className="w-32 h-32"
                                    />
                                )}
                            </div>
                            <div className="text-xl font-bold ml-4">
                                {user?.username}
                            </div>
                        </div>
                        <div className="rounded-xl settings-account-body bg-discord-dark-grey mt-4 w-full"></div>
                    </div>
                </div>
            </div>
            <div>
                {showConfirmAvatarPopup && (
                    <ConfirmAvatarPopUp
                        onFileChange={handleFileChange}
                        onConfirm={handleConfirmChange}
                        onCancel={handleCancelChange}
                    />
                )}
            </div>
        </div>
    );
};

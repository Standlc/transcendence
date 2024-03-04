import { useNavigate } from "react-router-dom";
import defaultAvatar from "../components/defaultAvatar.png";
import { LoginResponse, useAuth } from "../components/RequireAuth/AuthProvider";
import { useState } from "react";
import ModalLayout from "../UIKit/ModalLayout";
import { ConfirmPopUp } from "../components/ConfirmPopUp";
import { ConfirmAvatarPopUp } from "../components/ConfirmAvatarPopUp";

export const Settings = () => {
    const user = useAuth();
    const [showConfirmAvatarPopup, setShowConfirmAvatarPopup] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

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
                        value={user.loginResponse?.username}
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
                        value={user.loginResponse?.firstname ?? ""}
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
                        value={user.loginResponse?.lastname ?? ""}
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
            </div>

            {/* Section des informations de l'utilisateur à droite */}
            <div className="flex-1 mt-40">
                <div className="items-center justify-center h-full">
                    <div className="rounded-b-xl settings-account bg-discord-black flex flex-col items-center justify-center p-4">
                        <div className="flex flex-row items-center">
                            <div className="rounded-full bg-greyple p-1">
                                {user.loginResponse?.avatarUrl ? (
                                    <img
                                        src={user.loginResponse.avatarUrl}
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
                                {user.loginResponse?.username}
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

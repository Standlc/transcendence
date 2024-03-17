import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ConfirmAvatarPopUp } from "./ConfirmAvatarPopUp";
import { AppUser } from "@api/types/clientSchema";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { TwoFactorAuthentificationSetupModal } from "../../../components/TwoFactorAuthentificationSetupModal";
import { Avatar } from "../../../UIKit/avatar/Avatar";

interface Props {
    user: AppUser | undefined;
}

export const Settings: React.FC<Props> = ({ user }: Props) => {
    if (!user) return null;

    const [showConfirmAvatarPopup, setShowConfirmAvatarPopup] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();
    const [bio, setBio] = useState(user?.bio);
    const [firstname, setFirstname] = useState(user?.firstname);
    const [lastname, setLastname] = useState(user?.lastname);
    const [show2FASetupModal, setShow2FASetupModal] = useState(false);

    const handleClickChangeAvatar = () => {
        setShowConfirmAvatarPopup(true);
    };

    const handleFileChange = (file) => {
        setSelectedFile(file);
    };

    const handleConfirmChange = async () => {
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const response = await axios.post("/api/upload/user-avatar", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                queryClient.setQueryData<AppUser | undefined>(["user"], (oldData) => {
                    return { ...oldData, avatarUrl: response.data.avatarUrl };
                });

                alert("Avatar updated successfully");
                console.log("Avatar updated successfully", response.data.avatarUrl);
            } catch (error) {
                console.error("Failed to upload avatar", error);
                alert("Failed to upload avatar");
            }
        }
        setShowConfirmAvatarPopup(false); // Hide the popup regardless of the outcome
    };

    const handleCancelChange = () => {
        setShowConfirmAvatarPopup(false);
    };

    const queryClient = useQueryClient();

    const updateUserProfile = async () => {
        try {
            const body = {
                bio,
                firstname,
                lastname,
            };
            await axios.patch("/api/users/update", body, {});

            alert("Profile updated successfully");
            queryClient.setQueryData<AppUser | undefined>(["user"], (oldData) => {
                if (oldData && typeof oldData === "object") {
                    return { ...oldData, ...body };
                } else {
                    return undefined;
                }
            });
        } catch (error) {
            console.error("Failed to update profile", error);
            // Handle errors, for example, display a message to the user
            alert("Failed to update profile");
        }
    };

    const logout = async () => {
        try {
            await axios.get("/api/auth/logout");

            localStorage.removeItem("token");
            queryClient.invalidateQueries({ queryKey: ["user"] });
        } catch (error) {
            console.error("Error while disconnecting", error);
        }
        queryClient.setQueryData(["user"], null);
        navigate("/", { replace: true });
    };

    const handleCloseClick = () => {
        navigate("/");
    };

 // Importez d'abord vos composants et hooks nécessaires en haut de votre fichier

return (
    <div className="flex w-full h-full justify-center items-center">
        {show2FASetupModal && (
            <TwoFactorAuthentificationSetupModal hide={() => setShow2FASetupModal(false)} />
        )}
        <div className="flex flex-col w-full max-w-4xl mx-auto mt-20 p-10 bg-discord-dark-grey rounded-lg shadow-lg">
            <div className="text-4xl font-bold text-left">Settings</div>
            <div className="text-xl text-white  text-left text-opacity-60 mb-20"> Profil </div>
            <div className="flex justify-between items-start gap-10">
                <div className="flex flex-col flex-1 gap-6">
                    <div className="mb-6 w-2/3 w-2/3">
                        <label htmlFor="firstname" className="font-bold block mb-2 text-sm text-white">
                            FIRSTNAME
                        </label>
                        <input
                            type="text"
                            id="firstname"
                            value={firstname ?? ""}
                            onChange={(e) => setFirstname(e.target.value)}
                            className="bg-discord-light-black text-white rounded-l w-full h-10 px-2.5"
                            placeholder="Firstname"
                        />
                    </div>
                    <div className="mb-6 w-2/3">
                        <label htmlFor="lastname" className="font-bold block mb-2 text-sm text-white">
                            LASTNAME
                        </label>
                        <input
                            type="text"
                            id="lastname"
                            value={lastname ?? ""}
                            onChange={(e) => setLastname(e.target.value)}
                            className="bg-discord-light-black text-white rounded-l w-full h-10 px-2.5"
                            placeholder="Lastname"
                        />
                    </div>
                    <div className="mb-6 w-2/3">
                        <label htmlFor="bio" className="font-bold block mb-2 text-sm text-white">
                            BIO
                        </label>
                        <input
                            type="text"
                            id="bio"
                            value={bio ?? ""}
                            onChange={(e) => setBio(e.target.value)}
                            className="bg-discord-light-black text-white rounded-l w-full h-10 px-2.5"
                            placeholder="Bio"
                        />
                    </div>
                </div>

                {/* <div className="flex flex-col items-center">
                    <di</div>
                </div> */}
                <div className="flex flex-col items-center">
                    <Avatar imgUrl={user.avatarUrl} size="2xl" userId={user.id} />
                    <button onClick={handleClickChangeAvatar} className="mt-4 text-white bg-indigo-500 hover:bg-indigo-600 font-bold py-2 px-4 rounded">
                        CHANGE AVATAR
                    </button>
                </div>
            </div>
            <div className="mt-10 flex flex-col items-start gap-4">
                <button onClick={updateUserProfile} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                    Save Changes
                </button>

                {user?.isTwoFactorAuthenticationEnabled ? (
                    <span className="text-green-500">2FA is set up</span>
                ) : (
                    <button onClick={() => setShow2FASetupModal(true)} className="text-white bg-purple-500 hover:bg-purple-600 font-bold py-2 px-4 rounded">
                        Set up 2FA
                    </button>
                )}

                <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                    LOG OUT
                </button>
            </div>
        </div>

        {showConfirmAvatarPopup && (
            <ConfirmAvatarPopUp
                onFileChange={handleFileChange}
                onConfirm={handleConfirmChange}
                onCancel={handleCancelChange}
            />
        )}
    </div>
);
        };
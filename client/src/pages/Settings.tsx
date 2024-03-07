import { useNavigate } from "react-router-dom";
import defaultAvatar from "../components/defaultAvatar.png";
import { useEffect, useState } from "react";
import { ConfirmAvatarPopUp } from "../components/ConfirmAvatarPopUp";
import { AppUser } from "@api/types/clientSchema";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    user: AppUser | undefined;
}

export const Settings: React.FC<Props> = ({ user }: Props) => {

    if (!user)
        return (null);

    const [showConfirmAvatarPopup, setShowConfirmAvatarPopup] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();
    const [bio, setBio] = useState(user?.bio);
    const [firstname, setFirstname] = useState(user?.firstname);
    const [lastname, setLastname] = useState(user?.lastname);

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
                const response = await axios.post("/api/users/avatar", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                queryClient.setQueryData<AppUser | undefined>(["user"], (oldData) => {
                    return { ...oldData, avatarUrl: response.data.avatarUrl };
                });

                alert("Avatar updated successfully");
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
                    return undefined; // Assuming undefined is the correct value when no user data exists
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
            console.error("Erreur lors de la déconnexion", error);
        }
        queryClient.setQueryData(["user"], null);
        navigate("/", { replace: true });
    };

    const handleCloseClick = () => {
        navigate("/");
    };

    return (
        <div className="flex w-full">
            {/* Section des champs d'entrée à gauche */}
            <div className="ml-[400px] mt-20 w-[400px] mr-[100px]">
                <div className="text-xl font-bold text-left ml-10 mb-20">Profil</div>
                {/* <div className="mb-6 w-[250px]">
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
                </div> */}
                <div className="mb-6  w-[250px]">
                    <label
                        htmlFor="firstname"
                        className="text-left font-bold block mb-2 text-sm text-white"
                    >
                        FIRSTNAME
                    </label>
                    <input
                        type="text"
                        id="firstname"
                        value={firstname ?? ""}
                        onChange={(e) => setFirstname(e.target.value)}
                        className="bg-discord-light-black text-white text-sm rounded-l block w-full h-10 px-2.5"
                        placeholder="Firstname"
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
                        type="text"
                        id="LASTNAME"
                        value={lastname ?? ""}
                        onChange={(e) => setLastname(e.target.value)}
                        className="bg-discord-light-black text-white text-sm rounded-l block w-full h-10 px-2.5"
                        placeholder="Lastname"
                    />
                </div>
                <div className="mb-6  w-[250px]">
                    <label
                        htmlFor="bio"
                        className="text-left font-bold block mb-2 text-sm text-white"
                    >
                        BIO
                    </label>
                    <input
                        type="text"
                        id="bio"
                        value={bio ?? ""}
                        onChange={(e) => setBio(e.target.value)}
                        className="bg-discord-light-black text-white text-sm rounded-l block w-full h-10 px-2.5"
                        placeholder="I have no life"
                    />
                </div>

                <div className="text-left w-[400px] mt-[50px]">
                    <button
                        onClick={handleClickChangeAvatar}
                        className="bg-blurple hover:bg-blurple-hover text-white text-sm rounded-lg h-10 py-2 px-2.5"
                    >
                        CHANGE AVATAR
                    </button>
                    <button className="ml-10 hover:underline">Delete Avatar</button>
                </div>
                <div
                    className="w-[200px] border-b mt-[20px] border-b-discord-light-grey "
                    style={{ borderBottomWidth: "1px" }}
                ></div>
                <div className="text-left w-[400px] mt-[20px]">
                    <button
                        onClick={updateUserProfile}
                        className="bg-green text-white text-sm rounded-lg h-10 py-2 px-2.5"
                    >
                        Save Changes
                    </button>
                </div>
                <div
                    className="w-[200px] border-b mt-[20px] border-b-discord-light-grey "
                    style={{ borderBottomWidth: "1px" }}
                ></div>
                <div className="mt-[20px] text-left">
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { CreateChannelResponse } from "../types/channel";

interface Props {
    onClose: () => void;
}

interface NewChannelData {
    isPublic: boolean;
    name: string;
    photoUrl?: string | null;
    password?: string | null;
}

export const ChanPopUp: React.FC<Props> = ({ onClose }: Props) => {
    const [isPublic, setIsPublic] = useState(true);
    const queryClient = useQueryClient();
    // const [selectedFile, setSelectedFile] = useState<File>();
    const [channelName, setChannelName] = useState("");
    const [password, setPassword] = useState("");

    // const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const fileList = event.target.files;
    //     if (fileList && fileList.length > 0) {
    //         const file = fileList[0];
    //         setSelectedFile(file);
    //     }
    // };

    // const uploadChannelAvatar = async () => {
    //     if (selectedFile) {
    //         const formData = new FormData();
    //         formData.append("file", selectedFile);

    //         try {
    //             const response = await axios.post(
    //                 "/api/upload/channel-photo",
    //                 formData,
    //                 {
    //                     headers: {
    //                         "Content-Type": "multipart/form-data",
    //                     },
    //                 }
    //             );

    //             alert("Avatar channel updated successfully");
    //             console.log("Avatar updated successfully", response.data.avatarUrl);
    //         } catch (error) {
    //             console.error("Failed to upload avatar", error);
    //             alert("Failed to upload avatar");
    //         }
    //     }
    // };

    const createNewChannel = useMutation<any, any, NewChannelData>({
        mutationFn: async (newChannelData) => {
            try {
                const response = await axios.post("/api/channels", newChannelData);
                console.log(response.data);
                return response.data;
            } catch (error) {
                throw new Error(error.response.data.message);
            }
        },
        onSuccess: (data) => {
            console.log("New channel created:", data);
            queryClient.setQueryData<CreateChannelResponse[] | undefined>(
                ["channels"],
                (oldData) => {
                    if (!oldData) return [data]; // Si les données sont vides, ajoutez simplement le nouveau canal
                    return [...oldData, data]; // Ajoutez le nouveau canal aux données existantes
                }
            );
            queryClient.invalidateQueries("channels", { exact: true });
        },
        onError: (error) => {
            console.error("Error creating channel:", error);
        },
    });

    const handleConfirm = () => {
        if (channelName.trim().length < 1) {
            // Vérifie si le nom du canal contient au moins une lettre
            alert("Channel name must contain at least one letter.");
            return;
        }

        console.log("is public", isPublic);
        console.log("channel name", channelName);
        console.log("password", password);
        createNewChannel.mutate({
            isPublic,
            name: channelName,
            photoUrl: null,
            password: isPublic ? null : password,
        });

        onClose();
    };

    return (
        <div className=" top-0 left-0 w-full h-full flex justify-center items-center bg-discord-light-grey bg-opacity-30 z-10">
            <div className="bg-discord-light-grey w-[500px] h-[550px] rounded-md shadow-lg flex flex-col">
                <div className="mt-10 text-2xl font-bold">Create your Channel</div>
                <div className="flex justify-center mt-10">
                    <button
                        onClick={() => setIsPublic(true)}
                        className={`px-4 py-2 bg-blurple text-white rounded hover:bg-blurple-hover mr-10 ${
                            isPublic ? "bg-blurple" : "bg-discord-black"
                        }`}
                    >
                        PUBLIC
                    </button>

                    <button
                        onClick={() => setIsPublic(false)}
                        className={`px-4 py-2 bg-blurple text-white rounded hover:bg-blurple-hover ml-10 ${
                            !isPublic ? "bg-blurple" : "bg-discord-black"
                        }`}
                    >
                        PRIVATE
                    </button>
                </div>
                <div className="mt-10 text-left ml-10">
                    <label
                        htmlFor="password"
                        className="text-left font-bold block mb-2 text-sm ml-1
                                text-white"
                    >
                        CHANNEL NAME <span className="text-discord-red">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="Channel Name"
                        onChange={(e) => setChannelName(e.target.value)}
                        className="px-4 py-2 bg-discord-black text-white rounded"
                    />
                </div>
                {!isPublic ? (
                    <div className="mt-5 text-left ml-10">
                        <label
                            htmlFor="password"
                            className="text-left font-bold block mb-2 text-sm ml-1
                                text-white"
                        >
                            PASSWORD
                        </label>
                        <input
                            type="text"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="px-4 py-2 bg-discord-black text-white rounded"
                        />
                    </div>
                ) : null}
                {/* <div className="block  mt-5 text-left ml-10">
                    Select Channel's Avatar
                    <div className="text-red-500">
                        <label
                            htmlFor="select-avatar"
                            className="mt-2 hover:bg-green-500 bg-green-700 text-white font-bold py-2 px-4 rounded inline-block cursor-pointer"
                        >
                            <div>{selectedFile ? selectedFile.name : "Browse..."}</div>
                        </label>
                        <input
                            onChange={handleFileSelected}
                            className="hidden"
                            type="file"
                            id="select-avatar"
                        />
                    </div>
                </div> */}
                <div className="mt-[450px] ml-[200px]  fixed">
                    <button
                        className="mt-4 w-[100px] px-4 py-2 bg-green-700 text-white rounded hover:bg-green-500 mr-5"
                        onClick={handleConfirm}
                    >
                        CONFIRM
                    </button>
                </div>
                <div className="fixed ml-[450px] mt-[20px]">
                    <button onClick={onClose}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

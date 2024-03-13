import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Settings } from "@mui/icons-material";
import { Collapsible } from "./Collapsible";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useGetUser } from "../../utils/useGetUser";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { AllUserDm } from "../../types/allUserDm";
import { AllChannels } from "../../types/channel";
import { Timestamp } from "@api/types/schema";

interface AllChannels {
    channelOwner : number,
    createdAt : Timestamp;
    id : number;
    isPublic: boolean;
    name : string ;
    photoUrl : string | null;
}

export const ChanColumn = () => {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState<number | null>(null);
    const user = useGetUser();
    const allDms = useQuery({
        queryKey: ["dms"],
        queryFn: async () => {
            const res = await axios.get<AllUserDm[]>("/api/dm");
            return res.data;
        },
    });

    const allChannels = useQuery({
        queryKey: ["allChannels"],
        queryFn: async () => {
            const res = await axios.get<AllChannels[]>("/api/channels");
            return res.data;
        },
    });



    const handleButtonClick = (index: number) => {
        if (index === -1) {
            handleFriendsClick();
            setActiveButton(index);
        } else {
            setActiveButton(index);
        }
    };

    const handleFriendsClick = () => {
        navigate("friends");
        setActiveButton(-1);
    };

    const handleSettingClick = () => {
        navigate("/settings");
    };

    const otherhUser = (conv: AllUserDm) => {
        if (conv.user1.userId === user?.id) {
            return conv.user2;
        } else {
            return conv.user1;
        }
    };

    console.log("allchannels", allChannels.data);

    return (
        <div className="bg-not-quite-black chan-column">

            <div className="w-full item-center justify-center">
                <div
                    onClick={() => handleButtonClick(-1)}
                    className={`cell-chan text-xl align-center hover:bg-discord-light-grey hover:rounded-lg rounded-lg ml-6 mt-1${
                        activeButton === -1
                            ? " bg-discord-light-grey"
                            : " bg-not-quite-black"
                    }`}
                    style={{ cursor: "pointer" }}
                >
                    <svg
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
                    <div onClick={handleFriendsClick} className="ml-6 mt-1 ">
                        <button>Friends</button>
                    </div>
                </div>
            </div>
            <div className="cell-chan font-bold text-greyple hover:text-white hover:rounded-md text-sm text-left flex items-center justify-between">
                <div className="flex "> PRIVATE MESSAGES</div>

                <span className="bloc text-right">+</span>
            </div>
            <div className="ml-5 text-left h-[300px] overflow-y-auto ">
                <Collapsible title="Conversation">
                    {allDms.data?.map((conv, index) => (
                        <Link
                            key={index}
                            className={`mb-2 flex hover:bg-discord-light-grey py-2 rounded-lg w-[280px] ${
                                activeButton == index
                                    ? "bg-discord-light-grey"
                                    : "bg-not-quite-black"
                            }`}
                            to={`dm/${conv.id}`}
                        >
                            <Avatar
                                imgUrl={otherhUser(conv).avatarUrl}
                                size="md"
                                userId={otherhUser(conv).userId}
                                status={otherhUser(conv).status}
                                borderRadius={0.5}
                            />
                            <div className="ml-5">{otherhUser(conv).username}</div>
                        </Link>
                    ))}
                </Collapsible>
            </div>
            <div className="ml-5 mt-2 text-left h-[370px] overflow-y-auto">
                <Collapsible title="Channels">
                    {allChannels.data?.map((channel, index) => (
                        <Link
                            key={index}
                            className={`mb-2 flex hover:bg-discord-light-grey py-2 rounded-lg w-[280px] ${
                                activeButton === index
                                    ? "bg-discord-light-grey"
                                    : "bg-not-quite-black"
                            }`}
                            to={`channels/${channel.id}`}
                        >
                            <Avatar
                                imgUrl={channel.photoUrl}
                                size="md"
                                userId={channel.id}
                                borderRadius={0.5}
                            />
                            <div className="ml-5">{channel.name}</div>
                        </Link>
                    ))}
                </Collapsible>
            </div>
            <div className="flex bg-almost-black text-m user-chancolumn items-center justify-between">
                <div className="flex items-center">
                    <Avatar
                        imgUrl={user?.avatarUrl}
                        size="md"
                        userId={user?.id ?? 0}
                        status={1}
                        borderRadius={0.5}
                    />
                    <div className="ml-[10px]">
                        <div className="font-bold text-left ">{user?.username}</div>
                        <div className="text-green text-left">En ligne</div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        className="text-right mr-[10px] px-2"
                        onClick={handleSettingClick}
                    >
                        <Settings />
                    </button>
                </div>
            </div>
        </div>
    );
};

import { Socket } from "socket.io-client";
import { Avatar } from "../../../UIKit/avatar/Avatar";
import { CreateChannelResponse, ChannelUser } from "../../../types/channel";
import { useEffect, useState } from "react";

interface Props {
    onClose: () => void;
    chanInfo: CreateChannelResponse | undefined;
    chatSocket: Socket;
}

export const KickPopUp: React.FC<Props> = ({ onClose, chanInfo, chatSocket }) => {
    const kickUser = (userId: number) => {
        if (chanInfo?.id) {
            console.log("Attempting to kick userId:", userId);
            const body = {
                targetUserId: userId,
                channelId: chanInfo.id,
            };
            chatSocket.emit("kickUser", body);
        }
    };
    return (
        <div className="top-0 left-0 w-full h-full flex justify-center items-center bg-discord-light-grey bg-opacity-30 z-10">
            <div className="bg-discord-light-grey w-[500px] h-[550px] rounded-md shadow-lg flex flex-col">
                <div className="mt-10 text-2xl font-bold">Kick</div>

                <div className="mt-5 h-[500px] overflow-y-auto">
                    <ul>
                        {chanInfo?.users.map((user: ChannelUser) => (
                            <li key={user.userId}>
                                <div className="flex justify-between items-center hover:bg-discord-light-black mr-5 ml-5 rounded-lg p-2">
                                    <div className="flex items-center">
                                        <div className="ml-4 mt-2">
                                            <Avatar
                                                imgUrl={user.avatarUrl}
                                                size="md"
                                                userId={user.userId}
                                                status={user.status}
                                                borderRadius={0.5}
                                            />
                                        </div>
                                        <div className="font-bold text-center ml-[20px]">
                                            {user.username}
                                        </div>
                                    </div>

                                    <div className="mr-[5px]">
                                        <button
                                            onClick={() => kickUser(user.userId)}
                                            className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-700 mr-5"
                                        >
                                            Kick
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="fixed mt-[450px] ml-[220px] ">
                    <button
                        className="mt-4 w-[100px] px-4 py-2 bg-blurple text-white rounded hover:bg-blurple-hover mr-5"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

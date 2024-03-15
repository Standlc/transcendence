import { Socket } from "socket.io-client";
import { Avatar } from "../../../UIKit/avatar/Avatar";
import { CreateChannelResponse, ChannelUser } from "../../../types/channel";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { DoNotDisturbOn, PersonRemove } from "@mui/icons-material";
import { ActionsMenu, MenuActionType } from "../../../UIKit/ActionsMenu";
import { useState } from "react";
import { AppUser } from "@api/types/clientSchema";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

interface Props {
    onClose: () => void;
    chanInfo: CreateChannelResponse | undefined;
    chatSocket: Socket;
    currentUser: AppUser;
}

export const PopUpCmd: React.FC<Props> = ({
    onClose,
    chanInfo,
    chatSocket,
    currentUser,
}) => {
    const [nbrUsers, setNbrUsers] = useState<number>(chanInfo?.users.length || 0);

    const doCmds = (label: string, targetId: number) => {
        if (label === "Kick") {
            console.log("Attempting to kick userId:");
            const body = {
                targetUserId: targetId,
                channelId: chanInfo?.id,
            };
            chatSocket.emit("kickUser", body);
        } else if (label === "Mute") {
            console.log("Attempting to mute userId:", targetId);
            const now = new Date();
            const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);
            const body = {
                targetUserId: targetId,
                channelId: chanInfo?.id,
                muteEnd: fiveMinutesLater.toISOString(),
            };
            chatSocket.emit("muteUser", body);
        } else if (label === "Ban") {
            console.log("Attempting to ban userId:", targetId);
            const body = {
                targetUserId: targetId,
                channelId: chanInfo?.id,
            };
            chatSocket.emit("banUser", body);
        } else if (label === "Add Admin") {
            console.log("Attempting to give admin userId:", targetId);
            const body = {
                targetUserId: targetId,
                channelId: chanInfo?.id,
            };
            chatSocket.emit("addChannelAdmin", body);
        }
        // else if (label === "Leave") {
        //     console.log("Attempting to leave channelId:", channelId);
        //     const body = {
        //         channelId: chanInfo?.id,
        //         password: password,
        //     };
        //     chatSocket.emit("leaveChannel", body);
        // }
    };

    return (
        <div className=" w-[500px] h-[550px] flex flex-col">
            <div className="mt-10 ml-10 text-3xl text-left font-bold">
                {chanInfo?.name}
            </div>
            <div className="mt-5 ml-10 text-left text-sm  font-bold opacity-50">
                CHANNEL MEMBERS — {nbrUsers}
            </div>
            <div className="mt-5 h-[500px] overflow-y-auto px-5 py-2">
                <ul>
                    {chanInfo?.users.map((user: ChannelUser) => {
                        let userActions: MenuActionType[] = [];

                        if (chanInfo?.channelOwner === currentUser.id) {
                            userActions = userActions.concat([
                                {
                                    label: "Kick",
                                    onClick: () => doCmds("Kick", user.userId),
                                    color: "red",
                                    icon: <PersonRemove fontSize="small" />,
                                },
                                {
                                    label: "Ban",
                                    onClick: () => doCmds("Ban", user.userId),
                                    color: "red",
                                    icon: <DoNotDisturbOn fontSize="small" />,
                                },
                                {
                                    label: "Mute",
                                    onClick: () => doCmds("Mute", user.userId),
                                    color: "red",
                                    icon: <VolumeOffIcon fontSize="small" />,
                                },
                                {
                                    label: "Add Admin",
                                    onClick: () => doCmds("Add Admin", user.userId),
                                    color: "base",
                                    icon: <VerifiedUserIcon fontSize="small" />,
                                },
                            ]);
                        }
                        // TODO not leave but send message
                        userActions.push({
                            label: "send message",
                            onClick: () => doCmds("Leave", user.userId),
                            color: "base",
                        });
                        return (
                            <li key={user.userId}>
                                <div className="flex justify-between items-center hover:bg-white hover:bg-opacity-5 hover:rounded-md px-5 py-2">
                                    <div className="flex items-center">
                                        <div>
                                            <Avatar
                                                imgUrl={user.avatarUrl}
                                                size="md"
                                                userId={user.userId}
                                                status={user.status}
                                                borderRadius={0.5}
                                            />
                                        </div>
                                        <div className="font-bold ml-[20px]">
                                            {user.username}
                                        </div>
                                    </div>
                                    <div className="items-center flex bg-black bg-opacity-30 hover:bg-black hover:bg-opacity-70 rounded-full px-2 py-2">
                                        <ActionsMenu actions={userActions} />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div>
                <button
                    className="gap px-5 py-2 bg-indigo-500 text-white rounded-md hover:bg-blurple-hover mb-5"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

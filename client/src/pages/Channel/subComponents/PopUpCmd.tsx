import { Socket } from "socket.io-client";
import { Avatar } from "../../../UIKit/avatar/Avatar";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { DoNotDisturbOn, PersonRemove } from "@mui/icons-material";
import { ActionsMenu, MenuActionType } from "../../../UIKit/ActionsMenu";
import { useState } from "react";
import { AppUser } from "@api/types/clientSchema";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { ChannelDataWithUsersWithoutPassword } from "@api/types/channelsSchema";
import { useKickMemberFromChannel } from "../../../utils/channels/useKickMemberFromChannel";
import { useBanUserFromChannel } from "../../../utils/channels/useBanUserFromChannel";
import { useMuteMember } from "../../../utils/channels/useMuteMember";
import { useAddAdmin } from "../../../utils/channels/useAddAdmin";
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';

interface Props {
    onClose: () => void;
    chanInfo: ChannelDataWithUsersWithoutPassword | undefined;
    chatSocket: Socket;
    currentUser: AppUser;
    
}

export const PopUpCmd: React.FC<Props> = ({
    onClose,
    chanInfo,
    currentUser,
}) => {
    const [nbrUsers, setNbrUsers] = useState<number>(chanInfo?.users.length || 0);
    const kickMember = useKickMemberFromChannel();
    const banMember = useBanUserFromChannel();
    const muteMember = useMuteMember();
    const addAdmin = useAddAdmin();


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
                    {chanInfo?.users.map((user) => {
                        let userActions: MenuActionType[] = [];
                        if (chanInfo?.channelOwner === currentUser.id) {
                           
                            userActions = userActions.concat([
                                {
                                    label: "Kick",
                                    onClick : () => kickMember.mutate({
                                        channelId:  chanInfo.id,
                                        userId: user.userId
                                    }),
                                    color: "red",
                                    icon: <PersonRemove fontSize="small" />,
                                },
                                {
                                    label: "Ban",
                                    onClick : () => banMember.mutate({
                                        channelId:  chanInfo.id,
                                        userId: user.userId
                                    }),
                                    color: "red",
                                    icon: <DoNotDisturbOn fontSize="small" />,
                                },
                                {
                                    label: "Mute",
                                    onClick : () => muteMember.mutate({
                                        channelId:  chanInfo.id,
                                        userId: user.userId
                                    }),
                                    color: "red",
                                    icon: <VolumeOffIcon fontSize="small" />,
                                },
                                {
                                    label: "Add Admin",
                                    onClick : () => addAdmin.mutate({
                                        channelId:  chanInfo.id,
                                        userId: user.userId
                                    }),
                                    color: "base",
                                    icon: <VerifiedUserIcon fontSize="small" />,
                                },
                            ]);
                        }
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
                                            {chanInfo.channelOwner === user.userId && (
                                                <span className="ml-2"><VerifiedRoundedIcon/> </span>
                                            )}
                                            {user.isAdmin && (
                                                <span className="ml-2"><HowToRegRoundedIcon/> </span>
                                             )}
                                        </div>
                                    </div>
                                    <div className="">
                                        <ActionsMenu actions={userActions} />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="text-right mr-2 mb-2">
               <button
                    className="px-5 py-2 bg-indigo-500 text-white rounded-md hover:bg-blurple-hover"
                    onClick={onClose}
                    >
                        Close
                </button>
            </div>
        </div>
    );
};

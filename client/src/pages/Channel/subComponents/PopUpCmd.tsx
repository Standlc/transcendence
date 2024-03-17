import { Socket } from "socket.io-client";
import { Avatar } from "../../../UIKit/avatar/Avatar";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { DoNotDisturbOn, PersonRemove } from "@mui/icons-material";
import { ActionsMenu, MenuActionType } from "../../../UIKit/ActionsMenu";
import { useContext, useState } from "react";
import { AppUser } from "@api/types/clientSchema";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { ChannelDataWithUsersWithoutPassword } from "@api/types/channelsSchema";
import { useKickMemberFromChannel } from "../../../utils/channels/useKickMemberFromChannel";
import { useBanUserFromChannel } from "../../../utils/channels/useBanUserFromChannel";
import { useMuteMember } from "../../../utils/channels/useMuteMember";
import { useAddAdmin } from "../../../utils/channels/useAddAdmin";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import { useRemoveAdmin } from "../../../utils/channels/useRemoveAdmin";
import { UserProfileContext } from "../../../ContextsProviders/UserProfileIdContext";

interface Props {
  chanInfo: ChannelDataWithUsersWithoutPassword | undefined;
  chatSocket: Socket;
  currentUser: AppUser;
}

export const PopUpCmd: React.FC<Props> = ({ chanInfo, currentUser }) => {
  const [nbrUsers, setNbrUsers] = useState<number>(chanInfo?.users.length || 0);
  const kickMember = useKickMemberFromChannel();
  const banMember = useBanUserFromChannel();
  const muteMember = useMuteMember();
  const addAdmin = useAddAdmin();
  const removeAdmin = useRemoveAdmin();
  const { setUserProfileId } = useContext(UserProfileContext);

  const currentUserIsAdmin = chanInfo?.users.find(
    (user) => user.userId === currentUser.id
  )?.isAdmin;

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
            if (
              (chanInfo?.channelOwner === currentUser.id &&
                currentUser.id !== user.userId) ||
              (currentUserIsAdmin && currentUser.id !== user.userId)
            ) {
              const isAdmin = user.isAdmin;
              const adminAction = isAdmin
                ? {
                    label: "Remove Admin",
                    onClick: () =>
                      removeAdmin.mutate({
                        channelId: chanInfo.id,
                        userId: user.userId,
                      }),
                    color: "base" as const,
                    icon: <VerifiedUserIcon fontSize="small" />,
                  }
                : {
                    label: "Add Admin",
                    onClick: () =>
                      addAdmin.mutate({
                        channelId: chanInfo.id,
                        userId: user.userId,
                      }),
                    color: "base" as const,
                    icon: <VerifiedUserIcon fontSize="small" />,
                  };

              userActions = userActions.concat([
                {
                  label: "Kick",
                  onClick: () =>
                    kickMember.mutate({
                      channelId: chanInfo.id,
                      userId: user.userId,
                    }),
                  color: "red",
                  icon: <PersonRemove fontSize="small" />,
                },
                {
                  label: "Ban",
                  onClick: () =>
                    banMember.mutate({
                      channelId: chanInfo.id,
                      userId: user.userId,
                    }),
                  color: "red",
                  icon: <DoNotDisturbOn fontSize="small" />,
                },
                {
                  label: "Mute",
                  onClick: () =>
                    muteMember.mutate({
                      channelId: chanInfo.id,
                      userId: user.userId,
                    }),
                  color: "red",
                  icon: <VolumeOffIcon fontSize="small" />,
                },
                adminAction,
              ]);
            }
            return (
              <li key={user.userId}>
                <div
                  onClick={() => setUserProfileId(user.userId)}
                  className="flex justify-between items-center hover:bg-white hover:bg-opacity-5 hover:rounded-md px-2 py-2 cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="flex">
                      <div>
                        <Avatar
                          imgUrl={user.avatarUrl}
                          size="md"
                          userId={user.userId}
                          status={user.status}
                          borderRadius={0.5}
                        />
                      </div>
                      <div className="font-bold ml-[20px] gap-3 flex">
                        {user.username}
                        {chanInfo.channelOwner === user.userId && (
                          <span className="text-indigo-500 ">
                            <VerifiedRoundedIcon sx={{ fontSize: "medium" }} />{" "}
                          </span>
                        )}
                        {user.isAdmin && (
                          <span className="text-white opacity-40">
                            <HowToRegRoundedIcon sx={{ fontSize: "medium" }} />{" "}
                          </span>
                        )}
                      </div>
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
    </div>
  );
};

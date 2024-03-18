import { Socket } from "socket.io-client";
import { Avatar } from "../../../UIKit/avatar/Avatar";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { Close, DoNotDisturbOn, PersonRemove } from "@mui/icons-material";
import { ActionsMenu, MenuActionType } from "../../../UIKit/ActionsMenu";
import { useContext, useEffect, useMemo, useState } from "react";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import {
  ChannelDataWithUsersWithoutPassword,
  UserInfo,
} from "@api/types/channelsSchema";
import { useKickMemberFromChannel } from "../../../utils/channels/useKickMemberFromChannel";
import { useBanUserFromChannel } from "../../../utils/channels/useBanUserFromChannel";
import { useMuteMember } from "../../../utils/channels/useMuteMember";
import { useAddAdmin } from "../../../utils/channels/useAddAdmin";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import { useRemoveAdmin } from "../../../utils/channels/useRemoveAdmin";
import { UserProfileContext } from "../../../ContextsProviders/UserProfileIdContext";
import { useQueryClient } from "@tanstack/react-query";
import { useGetUser } from "../../../utils/useGetUser";
import { DateTime } from "luxon";
import { useGetChannelBannedUsers } from "../../../utils/channels/useGetChannelBannedUsers";
import { Spinner } from "../../../UIKit/Kit";
import { ChannelAvatar } from "../../../UIKit/avatar/ChannelAvatar";
import { useUnbanUserFromChannel } from "../../../utils/channels/useUnbanUserFromChannel";
import { OutlinedIconLayout } from "../../../UIKit/OutlinedIconLayout";

interface Props {
  chanInfo: ChannelDataWithUsersWithoutPassword;
  chatSocket: Socket;
}

const TABS = ["All", "Admins", "Banned"] as const;

type TabsType = (typeof TABS)[number];

export const PopUpCmd: React.FC<Props> = ({ chanInfo }) => {
  const queryClient = useQueryClient();
  const user = useGetUser();
  const [currentTab, setCurrentTab] = useState<TabsType>("All");

  useEffect(() => {
    queryClient.setQueryData<ChannelDataWithUsersWithoutPassword>(
      ["channel", chanInfo?.id],
      () => {
        if (!chanInfo) return undefined;

        const owner = chanInfo.users.find(
          (u) => u.userId === chanInfo?.channelOwner
        );

        if (!owner) return chanInfo;

        return {
          ...chanInfo,
          users: [
            owner,
            ...chanInfo?.users.filter((u) => u.userId !== owner?.userId),
          ],
        };
      }
    );
  }, [queryClient, chanInfo?.users]);

  return (
    <div className="p-4 gap-5 w-[500px] flex flex-col">
      <div className="text-2xl text-left font-bold flex items-center gap-5">
        <ChannelAvatar
          imgUrl={chanInfo.photoUrl}
          size="lg"
          borderRadius={1}
          id={chanInfo.id}
        />
        {chanInfo?.name}'s members
      </div>

      <div className="flex flex-col gap-4 h-full">
        <div className="flex gap-2">
          {TABS.map((tab, i) => {
            const isSelected = tab === currentTab;
            return (
              <button
                key={i}
                onClick={() => setCurrentTab(tab)}
                className={`bg-black text-sm rounded-full px-3 py-1 text-white ${
                  !isSelected
                    ? "bg-opacity-15 hover:bg-opacity-40 text-opacity-50 hover:text-opacity-100"
                    : "bg-opacity-40 text-opacity-100"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {currentTab === "All" ? (
          <>
            <span className="text-left text-sm font-semibold opacity-50 uppercase">
              Channel Members — {chanInfo.users.length}
            </span>
            <div className="overflow-y-auto h-96 flex flex-col gap-[2px]">
              {chanInfo.users.map((member, i) => {
                return (
                  <ChannelMember
                    key={i}
                    member={member}
                    ownerId={chanInfo.channelOwner}
                    channelId={chanInfo.id}
                    isCurrentUserAdmin={chanInfo.users.some(
                      (u) => u.isAdmin && u.userId === user.id
                    )}
                  />
                );
              })}
            </div>
          </>
        ) : currentTab === "Banned" ? (
          <BannedUsers
            channelId={chanInfo.id}
            isCurrentUserAdmin={chanInfo.users.some(
              (u) => u.isAdmin && u.userId === user.id
            )}
          />
        ) : (
          <AdminsMembers
            ownerId={chanInfo.channelOwner}
            members={chanInfo.users}
            channelId={chanInfo.id}
            isCurrentUserAdmin={chanInfo.users.some(
              (u) => u.isAdmin && u.userId === user.id
            )}
          />
        )}
      </div>
    </div>
  );
};

const BannedUsers = ({
  channelId,
  isCurrentUserAdmin,
}: {
  channelId: number;
  isCurrentUserAdmin: boolean;
}) => {
  const bannedUsers = useGetChannelBannedUsers(channelId);
  const { setUserProfileId } = useContext(UserProfileContext);
  const unbanUser = useUnbanUserFromChannel();

  return (
    <>
      <span className="text-left text-sm font-semibold opacity-50 uppercase">
        Banned users — {bannedUsers.data?.length}
      </span>
      <div className="overflow-y-auto h-96 flex flex-col gap-[2px]">
        {!bannedUsers.data ? (
          <Spinner isLoading />
        ) : !bannedUsers.data.length ? (
          <div className="text-lg opacity-50 py-10">
            There aren't banned users from this channels
          </div>
        ) : (
          bannedUsers.data.map((user, i) => {
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md bg-white bg-opacity-0 hover:bg-opacity-5 p-2 cursor-pointer justify-between"
                onClick={() => setUserProfileId(user.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    imgUrl={user.avatarUrl}
                    userId={user.id}
                    size="sm"
                    borderRadius={1}
                  />
                  <span className="font-bold">{user.username}</span>
                </div>

                {isCurrentUserAdmin && (
                  <OutlinedIconLayout
                    theme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      unbanUser.mutate({ userId: user.id, channelId });
                    }}
                  >
                    <Close />
                  </OutlinedIconLayout>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

const AdminsMembers = ({
  members,
  ownerId,
  channelId,
  isCurrentUserAdmin,
}: {
  members: UserInfo[];
  ownerId: number;
  channelId: number;
  isCurrentUserAdmin: boolean;
}) => {
  const admins = members.filter((m) => m.isAdmin);

  return (
    <>
      <span className="text-left text-sm font-semibold opacity-50 uppercase">
        Channel Admins — {admins.length}
      </span>
      <div className="overflow-y-auto h-96 flex flex-col gap-[2px]">
        {!admins.length ? (
          <div className="text-lg opacity-50 py-10">
            There aren't any admins for this channels
          </div>
        ) : (
          admins.map((member, i) => {
            return (
              <ChannelMember
                key={i}
                member={member}
                ownerId={ownerId}
                channelId={channelId}
                isCurrentUserAdmin={isCurrentUserAdmin}
              />
            );
          })
        )}
      </div>
    </>
  );
};

const ChannelMember = ({
  member,
  ownerId,
  channelId,
  isCurrentUserAdmin,
}: {
  member: UserInfo;
  ownerId: number;
  channelId: number;
  isCurrentUserAdmin: boolean;
}) => {
  const actions: MenuActionType[] = [];
  const kickMember = useKickMemberFromChannel();
  const banMember = useBanUserFromChannel();
  const muteMember = useMuteMember();
  const addAdmin = useAddAdmin();
  const removeAdmin = useRemoveAdmin();
  const { setUserProfileId } = useContext(UserProfileContext);
  const user = useGetUser();

  const isMemberMuted = useMemo(() => {
    return DateTime.fromISO(member.mutedEnd as any).diffNow().milliseconds >= 0;
  }, [member.mutedEnd]);

  if (
    isCurrentUserAdmin &&
    member.userId !== ownerId &&
    user.id !== member.userId
  ) {
    actions.push(
      !member.isAdmin
        ? {
            label: "Add Admin",
            onClick: () =>
              addAdmin.mutate({
                channelId: channelId,
                userId: member.userId,
              }),
            color: "base" as const,
            icon: <VerifiedUserIcon fontSize="small" />,
          }
        : {
            label: "Remove Admin",
            onClick: () =>
              removeAdmin.mutate({
                channelId: channelId,
                userId: member.userId,
              }),
            color: "base" as const,
            icon: <PersonRemove fontSize="small" />,
          }
    );

    if (!isMemberMuted) {
      actions.push({
        label: "Mute",
        onClick: () =>
          muteMember.mutate({
            channelId: channelId,
            userId: member.userId,
          }),
        icon: <VolumeOffIcon fontSize="small" />,
      });
    }

    actions.push(
      {
        label: "Kick",
        onClick: () =>
          kickMember.mutate({
            channelId: channelId,
            userId: member.userId,
          }),
        color: "red",
        icon: <PersonRemove fontSize="small" />,
      },
      {
        label: "Ban",
        onClick: () =>
          banMember.mutate({
            channelId: channelId,
            userId: member.userId,
          }),
        color: "red",
        icon: <DoNotDisturbOn fontSize="small" />,
      }
    );
  }

  return (
    <div
      onClick={() => setUserProfileId(member.userId)}
      className="flex justify-between items-center hover:bg-white hover:bg-opacity-5 hover:rounded-md px-2 py-2 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Avatar
          imgUrl={member.avatarUrl}
          size="sm"
          userId={member.userId}
          status={member.status}
          borderRadius={0.5}
        />
        <div className="font-bold gap-2 flex">
          {member.username}
          {member.userId === ownerId && (
            <span className="text-indigo-500 ">
              <VerifiedRoundedIcon sx={{ fontSize: "medium" }} />
            </span>
          )}
          {member.isAdmin && (
            <span className="text-white opacity-40">
              <HowToRegRoundedIcon sx={{ fontSize: "medium" }} />
            </span>
          )}
          {isMemberMuted && (
            <span className="text-red-500 opacity-50">
              <VolumeOffIcon sx={{ fontSize: "medium" }} />
            </span>
          )}
        </div>
      </div>

      <ActionsMenu actions={actions} />
    </div>
  );
};

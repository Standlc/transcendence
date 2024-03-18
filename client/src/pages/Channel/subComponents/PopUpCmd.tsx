import { Socket } from "socket.io-client";
import { Avatar } from "../../../UIKit/avatar/Avatar";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import {
  Close,
  DoNotDisturbOn,
  PersonAdd,
  PersonRemove,
} from "@mui/icons-material";
import { ActionsMenu, MenuActionType } from "../../../UIKit/ActionsMenu";
import { useContext, useEffect, useMemo, useState } from "react";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import {
  ChannelDataWithUsersWithoutPassword,
  EligibleUserForChannel,
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
import { PlayerRating } from "../../../UIKit/PlayerRating";
import { useGetEligibleUsersForChannel } from "../../../utils/channels/useGetEligibleUsersForChannel";
import ModalLayout from "../../../UIKit/ModalLayout";
import { NoResult } from "../../../UIKit/NoResult";
import { useAddUserToChannel } from "../../../utils/channels/useAddUserToChannel";
import { SearchInput } from "../../../UIKit/SearchInput";

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
  const [showAddMembers, setShowAddMembers] = useState(false);
  const isCurrentUserAdmin = useMemo(
    () => chanInfo.users.some((u) => u.isAdmin && u.userId === user.id),
    [chanInfo.users, user.id]
  );

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
      {showAddMembers && (
        <AddUsersToChannel
          channelId={chanInfo.id}
          hide={() => setShowAddMembers(false)}
        />
      )}

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
        <div className="flex gap-2 justify-between items-center">
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

          {isCurrentUserAdmin && (
            <button
              onClick={() => setShowAddMembers(true)}
              className="bg-green-600 font-semibold text-sm px-2 flex items-center py-1 rounded-sm gap-2"
            >
              Add Members <PersonAdd style={{ fontSize: 18 }} />
            </button>
          )}
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
                    isCurrentUserAdmin={isCurrentUserAdmin}
                  />
                );
              })}
            </div>
          </>
        ) : currentTab === "Banned" ? (
          <BannedUsers
            channelId={chanInfo.id}
            isCurrentUserAdmin={isCurrentUserAdmin}
          />
        ) : (
          <AdminsMembers
            ownerId={chanInfo.channelOwner}
            members={chanInfo.users}
            channelId={chanInfo.id}
            isCurrentUserAdmin={isCurrentUserAdmin}
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
          <PlayerRating rating={member.rating} />
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

const AddUsersToChannel = ({
  channelId,
  hide,
}: {
  channelId: number;
  hide: () => void;
}) => {
  const users = useGetEligibleUsersForChannel(channelId);
  const [filteredUsers, setFilteredUsers] = useState(users.data);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setFilteredUsers(users.data);
  }, [users.data]);

  return (
    <ModalLayout onClickOutside={hide}>
      <div className="flex flex-col gap-4 p-4 min-w-96">
        <div className="flex flex-col">
          <span className="text-left font-extrabold text-2xl">
            Select Friends
          </span>
        </div>

        <SearchInput
          size="sm"
          autoFocus
          input={filter}
          placeHolder="Search friends"
          onSearch={(value) => {
            setFilter(value);
            setFilteredUsers(() => {
              if (!users.data) return undefined;
              if (value === "") return users.data;
              return users.data.filter((c) =>
                c.username.toLowerCase().match(value.toLowerCase())
              );
            });
          }}
        />

        <div className="flex flex-col gap-[2px] h-96 overflow-y-auto">
          {!users.data ? (
            <Spinner isLoading />
          ) : users.isError ? (
            <span>Error</span>
          ) : !filteredUsers?.length ? (
            <NoResult description={"No results"} />
          ) : (
            filteredUsers.map((user, i) => {
              return <UserToAdd user={user} key={i} channelId={channelId} />;
            })
          )}
        </div>
      </div>
    </ModalLayout>
  );
};

const UserToAdd = ({
  user,
  channelId,
}: {
  user: EligibleUserForChannel;
  channelId: number;
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const addUser = useAddUserToChannel({ onSuccess: () => setIsAdded(true) });

  return (
    <div className="flex items-center justify-between px-2 py-1 bg-white bg-opacity-0 hover:bg-opacity-5 rounded-sm">
      <div className="flex items-center gap-2 font-bold">
        <Avatar
          imgUrl={user.avatarUrl}
          userId={user.id}
          size="sm"
          borderRadius={1}
        />
        {user.username}
      </div>

      <button
        disabled={addUser.isPending || isAdded}
        onClick={() => addUser.mutate({ channelId, userId: user.id })}
        className="bg-green-600 text-sm font-semibold rounded-sm py-1 px-2 disabled:opacity-50"
      >
        Add +
      </button>
    </div>
  );
};

import { useContext, useEffect, useMemo, useState } from "react";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useGetUser } from "../../utils/useGetUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UserProfile } from "@api/types/clientSchema";
import { Spinner } from "../../UIKit/Kit";
import { SendGameInvitationModal } from "../SendGameInvitationModal";
import { ProfileGames } from "./ProfileGames";
import { ProfileAchievements } from "./ProfileAchievements";
import { ProfileFriends } from "./ProfileFriends";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { useAddFriend } from "../../utils/friends/useAddFriend";
import { useAcceptFriend } from "../../utils/friends/useAcceptFriend";
import { PersonAdd, SettingsRounded, SportsEsports } from "@mui/icons-material";
import { ProfileActionsMenu } from "./ProfileActionsMenu";
import { useNavigate } from "react-router-dom";
import { DateTime } from "luxon";
import { useStartConversation } from "../../utils/conversations/useStartConversation";
import { PlayerRating } from "../../UIKit/PlayerRating";

type TabsType = "Game History" | "Achievements" | "Friends";

export const Profile = ({
  userId,
  goTo,
}: {
  userId: number;
  goTo: (userId: number | undefined) => any;
}) => {
  const { addUsersStatusHandler, removeUsersStatusHandler } =
    useContext(SocketsContext);
  const [currentTab, setCurrentTab] = useState<TabsType>("Game History");
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const res = await axios.get<UserProfile>(`/api/users/profile/${userId}`);
      return res.data;
    },
  });

  useEffect(() => {
    addUsersStatusHandler({
      key: "profile",
      statusHandler: (data) => {
        if (data.userId === profile.data?.id) {
          queryClient.setQueryData(
            ["userProfile", data.userId],
            (prev: UserProfile | undefined) => {
              if (!prev) return undefined;
              return {
                ...prev,
                status: data.status,
              };
            }
          );
        }
      },
    });
    return () => removeUsersStatusHandler("profile");
  }, [addUsersStatusHandler, removeUsersStatusHandler, profile.data?.id]);

  if (profile.isError) {
    return <div className="">We could not find this user!</div>;
  }

  return (
    <div className="p-5 overflow-y-auto flex flex-col gap-5 w-[650px]">
      {!profile.data ? (
        <Spinner isLoading />
      ) : (
        <>
          <div className="flex justify-between items-end">
            <Avatar
              size="xl"
              imgUrl={profile.data.avatarUrl}
              userId={profile.data.id}
              status={profile.data.status}
              borderRadius={1}
            />

            <div className="flex gap-3 items-center h-10">
              <ProfileDirectActionButton profile={profile.data} />
              <ProfileActionsMenu profile={profile.data} />
            </div>
          </div>

          <div className="flex flex-col gap-5 bg-black bg-opacity-50 p-5 rounded-md">
            <div className="flex flex-col items-start">
              <div className="flex justify-between items-start w-full">
                <span className="font-bold text-2xl flex gap-3 items-center">
                  {profile.data.username}
                  <PlayerRating rating={profile.data.rating} />
                </span>
                <span className="opacity-50 text-sm">
                  Member since{" "}
                  {DateTime.fromISO(profile.data.createdAt as any).toFormat(
                    "LLL dd, yyyy"
                  )}
                </span>
              </div>
              {profile.data.bio && (
                <span className="opacity-70 text-left whitespace-pre-wrap [word-break:break-word] text-ellipsis overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
                  {profile.data.bio}
                </span>
              )}
            </div>

            <div
              className="grid grid-cols-3
          justify-between gap-0 border-b border-b-[rgba(255,255,255,0.2)]"
            >
              <TabElement
                title="Game History"
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
              />
              <TabElement
                title="Achievements"
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
              />
              <TabElement
                title="Friends"
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
              />
            </div>

            <div className="h-96 overflow-y-auto">
              {currentTab === "Game History" ? (
                <ProfileGames userId={userId} />
              ) : currentTab === "Achievements" ? (
                <ProfileAchievements userId={userId} />
              ) : (
                <ProfileFriends userId={userId} goTo={goTo} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

type ProfileDirectActionType = {
  label: string;
  onClick?: () => any | void;
  color?: "blue" | "green" | "gray";
  isPending?: () => boolean;
  icon?: any;
};

const ProfileDirectActionButton = ({ profile }: { profile: UserProfile }) => {
  const user = useGetUser();
  const addFriend = useAddFriend();
  const acceptFriend = useAcceptFriend();
  const startConversation = useStartConversation();
  const navigate = useNavigate();
  const [showGameInvitationModal, setShowGameInvitationModal] = useState(false);

  const quickActionButton = useMemo<ProfileDirectActionType[]>(() => {
    if (profile.id === user.id) {
      return [
        {
          label: "Edit",
          onClick: () => navigate("/settings"),
          color: "gray",
          icon: <SettingsRounded fontSize="small" />,
        },
      ];
    }

    if (profile.isBlocked || profile.isBlocking) {
      return [];
    }

    if (profile.isFriends) {
      return [
        {
          label: "Send Message",
          onClick: () => {
            if (profile.conversationId !== null) {
              navigate(`/home/dm/${profile.conversationId}`);
            } else {
              startConversation.mutate(profile.id);
            }
          },
          color: "green",
        },
        {
          label: "Play",
          onClick: () => {
            setShowGameInvitationModal(true);
          },
          icon: <SportsEsports fontSize="small" />,
        },
      ];
    }
    if (profile.friendRequestSourceUserId === user.id) {
      return [
        {
          label: "Friend Request Pending",
          color: "gray",
          isPending: () => true,
        },
      ];
    }
    if (profile.friendRequestSourceUserId === profile.id) {
      return [
        {
          label: "Accept Friend",
          onClick: () => {
            acceptFriend.mutate(profile.id);
          },
          icon: <PersonAdd fontSize="small" />,
          isPending: () => acceptFriend.isPending,
        },
      ];
    }
    return [
      {
        label: "Add Friend",
        onClick: () => {
          addFriend.mutate(profile.id);
        },
        icon: <PersonAdd fontSize="small" />,
        isPending: () => addFriend.isPending,
      },
    ];
  }, [profile, user.id]);

  const colorVariants = {
    blue: "hover:bg-indigo-500 bg-indigo-500",
    green: "bg-green-600",
    gray: "bg-white bg-opacity-10",
  };

  return (
    <div className="flex items-center gap-2">
      {showGameInvitationModal && (
        <SendGameInvitationModal
          invitedUser={{ username: profile.username, id: profile.id }}
          hide={() => setShowGameInvitationModal(false)}
        />
      )}
      {quickActionButton.map((action, i) => {
        return (
          <button
            key={i}
            disabled={action.isPending && action.isPending()}
            onClick={() => {
              if (action.onClick) action.onClick();
            }}
            className={`active:translate-y-0 flex items-center gap-2 px-4 py-2 text-base font-bold rounded-md ${
              colorVariants[action.color ?? "blue"]
            }`}
          >
            <span className="">{action.label}</span>
            {action.icon}
          </button>
        );
      })}
    </div>
  );
};

const TabElement = ({
  title,
  currentTab,
  setCurrentTab,
}: {
  title: TabsType;
  currentTab: TabsType;
  setCurrentTab: (tab: TabsType) => void;
}) => {
  return (
    <div className="flex justify-center relative group">
      <span
        onClick={() => setCurrentTab(title)}
        aria-selected={currentTab === title}
        className={`cursor-pointer w-full py-3 px-5 whitespace-nowrap opacity-50 aria-selected:opacity-100`}
      >
        {title}
      </span>
      <div
        aria-selected={currentTab === title}
        className="absolute bottom-0 group-hover:w-[15%] aria-selected:group-hover:w-[30%] rounded-t-md h-[4px] w-[5%] aria-selected:w-[30%] aria-selected:opacity-100 opacity-50 bg-white transition-all"
      ></div>
    </div>
  );
};

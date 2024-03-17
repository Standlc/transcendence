import { UserFriend } from "@api/types/clientSchema";
import { useGetFriends } from "../../utils/friends/useGetFriends";
import { useGetUser } from "../../utils/useGetUser";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { PlayerRating } from "../../UIKit/PlayerRating";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  DoNotDisturbOn,
  PersonRemove,
  QuestionAnswer,
  SportsEsports,
} from "@mui/icons-material";
import { ActionsMenu, MenuActionType } from "../../UIKit/ActionsMenu";
import { useRemoveFriend } from "../../utils/friends/useRemoveFriend";
import { useStartConversation } from "../../utils/conversations/useStartConversation";
import { useNavigate } from "react-router-dom";
import { UserProfileContext } from "../../ContextsProviders/UserProfileIdContext";
import { useBlockUser } from "../../utils/block/useBlockUser";
import { SendGameInvitationModal } from "../../components/SendGameInvitationModal";
import { UsersListWithSearch } from "../../components/friendsComponents/UsersListWithSearch";
import { useHandlerUsersStatusInLive } from "../../utils/useHandleUsersStatusInLive";
import { useQueryClient } from "@tanstack/react-query";

export const AllFriends = () => {
  const user = useGetUser();
  const friends = useGetFriends(user.id);
  const [filteredFriends, setFilteredFriends] = useState(friends.data);
  const queryClient = useQueryClient();

  useHandlerUsersStatusInLive("friends", (data) => {
    queryClient.setQueryData<UserFriend[]>(["friends", user.id], (prev) => {
      if (!prev) return undefined;
      return prev.map((friend) => {
        if (friend.id !== data.userId) return friend;

        return {
          ...friend,
          status: data.status,
        };
      });
    });
  });

  useEffect(() => {
    setFilteredFriends(friends.data);
  }, [friends.data]);

  return (
    <UsersListWithSearch
      title="ALL FRIENDS"
      emptyListDescription="You don't have any friends yet"
      isLoading={!filteredFriends}
      refetch={() => friends.refetch()}
      onSearch={(filter) => {
        setFilteredFriends(() => {
          if (!friends.data) return undefined;
          if (filter === "") return friends.data;
          return friends.data.filter((c) =>
            c.username.toLowerCase().match(filter.toLowerCase())
          );
        });
      }}
    >
      {filteredFriends
        ? filteredFriends.map((friend, i) => {
            return <Friend friend={friend} key={i} />;
          })
        : []}
    </UsersListWithSearch>
  );
};

const Friend = ({ friend }: { friend: UserFriend }) => {
  const [showGameInvitationModal, setShowGameInvitationModal] = useState(false);
  const { setUserProfileId } = useContext(UserProfileContext);
  const navigate = useNavigate();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const startConversation = useStartConversation();

  const actions = useMemo(() => {
    const availableActions: MenuActionType[] = [
      {
        label: "Play",
        onClick: () => {
          setShowGameInvitationModal(true);
        },
        icon: <SportsEsports fontSize="small" />,
      },
      {
        label: "Send Message",
        onClick: () => {
          if (friend.conversationId !== null) {
            navigate(`/home/dm/${friend.conversationId}`);
          } else {
            startConversation.mutate(friend.id);
          }
        },
        icon: <QuestionAnswer fontSize="small" />,
      },
      {
        label: "Remove Friend",
        onClick: () => {
          removeFriend.mutate(friend.id);
        },
        color: "red",
        icon: <PersonRemove fontSize="small" />,
      },
      {
        label: "Block",
        onClick: () => {
          blockUser.mutate(friend.id);
        },
        color: "red",
        icon: <DoNotDisturbOn fontSize="small" />,
      },
    ];
    return availableActions;
  }, [friend.conversationId, friend.id]);

  return (
    <>
      {showGameInvitationModal && (
        <SendGameInvitationModal
          invitedUser={{ username: friend.username, id: friend.id }}
          hide={() => setShowGameInvitationModal(false)}
        />
      )}

      <div
        onClick={() => setUserProfileId(friend.id)}
        className="flex items-center justify-between w-full py-2 px-2 cursor-pointer rounded-md bg-white bg-opacity-0 hover:bg-opacity-5"
      >
        <div className="flex items-center gap-3">
          <Avatar
            borderRadius={1}
            status={friend.status}
            userId={friend.id}
            imgUrl={friend.avatarUrl}
            size="md"
          />
          <span className="font-bold">{friend.username}</span>
          <PlayerRating rating={friend.rating} />
        </div>

        <ActionsMenu actions={actions} />
      </div>
    </>
  );
};

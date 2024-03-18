import { useContext, useEffect, useState } from "react";
import { useGetFriendRequests } from "../utils/friends/useGetFriendRequests";
import { UsersListWithSearch } from "../components/friendsComponents/UsersListWithSearch";
import { PlayerRating } from "../UIKit/PlayerRating";
import { Avatar } from "../UIKit/avatar/Avatar";
import { FriendRequestUser } from "@api/types/clientSchema";
import { UserProfileContext } from "../ContextsProviders/UserProfileIdContext";
import { useBlockUser } from "../utils/block/useBlockUser";
import { Check, Close, DoNotDisturbOn } from "@mui/icons-material";
import { ActionsMenu } from "../UIKit/ActionsMenu";
import { useAcceptFriend } from "../utils/friends/useAcceptFriend";
import { useDeclineFriendRequest } from "../utils/friends/useDeclineFriendRequest";
import { OutlinedIconLayout } from "../UIKit/OutlinedIconLayout";

export const FriendRequests = () => {
  const friendRequestUsers = useGetFriendRequests();
  const [filteredUsers, setFilteredUsers] = useState(friendRequestUsers.data);

  useEffect(() => {
    setFilteredUsers(friendRequestUsers.data);
  }, [friendRequestUsers.data]);

  return (
    <UsersListWithSearch
      title="FRIEND REQUESTS"
      emptyListDescription="You don't have any friend requests yet"
      isLoading={!filteredUsers}
      refetch={friendRequestUsers.refetch}
      onSearch={(filter) => {
        setFilteredUsers(() => {
          if (!friendRequestUsers.data) return undefined;
          if (filter === "") return friendRequestUsers.data;
          return friendRequestUsers.data.filter((c) =>
            c.username.toLowerCase().match(filter.toLowerCase())
          );
        });
      }}
    >
      {filteredUsers
        ? filteredUsers.map((user, i) => {
            return <FriendRequestUserComponent user={user} key={i} />;
          })
        : []}
    </UsersListWithSearch>
  );
};

const FriendRequestUserComponent = ({ user }: { user: FriendRequestUser }) => {
  const { setUserProfileId } = useContext(UserProfileContext);
  const acceptFriendRequest = useAcceptFriend();
  const declineFriendRequest = useDeclineFriendRequest();
  const blockUser = useBlockUser();

  return (
    <div
      onClick={() => setUserProfileId(user.id)}
      className="flex items-center justify-between w-full py-2 px-2 cursor-pointer rounded-md bg-white bg-opacity-0 hover:bg-opacity-5 group"
    >
      <div className="flex items-center gap-3">
        <Avatar
          borderRadius={1}
          status={user.status}
          userId={user.id}
          imgUrl={user.avatarUrl}
          size="md"
        />
        <span className="font-bold">{user.username}</span>
        <PlayerRating rating={user.rating} />
      </div>

      <div className="flex items-center gap-2">
        <OutlinedIconLayout
          theme="red"
          onClick={(e) => {
            e.stopPropagation();
            declineFriendRequest.mutate(user.id);
          }}
        >
          <Close />
        </OutlinedIconLayout>

        <OutlinedIconLayout
          onClick={(e) => {
            e.stopPropagation();
            acceptFriendRequest.mutate(user.id);
          }}
        >
          <Check />
        </OutlinedIconLayout>

        <ActionsMenu
          actions={[
            {
              label: "Block",
              onClick: () => {
                blockUser.mutate(user.id);
              },
              color: "red",
              icon: <DoNotDisturbOn fontSize="small" />,
            },
          ]}
        />
      </div>
    </div>
  );
};

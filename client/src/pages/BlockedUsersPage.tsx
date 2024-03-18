import { BlockedUser } from "@api/types/clientSchema";
import { useContext, useEffect, useState } from "react";
import { Close } from "@mui/icons-material";
import { useGetBlockedUsers } from "../utils/block/useGetBlockedUsers";
import { Avatar } from "../UIKit/avatar/Avatar";
import { UserProfileContext } from "../ContextsProviders/UserProfileIdContext";
import { useUnblockUser } from "../utils/block/useUnblockUser";
import { UsersListWithSearch } from "../components/friendsComponents/UsersListWithSearch";
import { OutlinedIconLayout } from "../UIKit/OutlinedIconLayout";

export const BlockedUsers = () => {
  const blockedUsers = useGetBlockedUsers();
  const [filteredUsers, setFilteredUsers] = useState(blockedUsers.data);

  useEffect(() => {
    setFilteredUsers(blockedUsers.data);
  }, [blockedUsers.data]);

  return (
    <UsersListWithSearch
      title="BLOCKED"
      emptyListDescription="You haven't blocked anybody"
      isLoading={!filteredUsers}
      refetch={blockedUsers.refetch}
      onSearch={(filter) => {
        setFilteredUsers(() => {
          if (!blockedUsers.data) return undefined;
          if (filter === "") return blockedUsers.data;
          return blockedUsers.data.filter((c) =>
            c.username.toLowerCase().match(filter.toLowerCase())
          );
        });
      }}
    >
      {filteredUsers
        ? filteredUsers.map((user, i) => {
            return <BlockedUserItem user={user} key={i} />;
          })
        : []}
    </UsersListWithSearch>
  );
};

const BlockedUserItem = ({ user }: { user: BlockedUser }) => {
  const { setUserProfileId } = useContext(UserProfileContext);
  const unblockUser = useUnblockUser();

  return (
    <div
      onClick={() => setUserProfileId(user.id)}
      className="flex items-center justify-between w-full py-2 px-2 cursor-pointer rounded-md bg-white bg-opacity-0 hover:bg-opacity-5"
    >
      <div className="flex items-center gap-3">
        <Avatar
          borderRadius={1}
          userId={user.id}
          imgUrl={user.avatarUrl}
          size="md"
        />
        <span className="font-bold">{user.username}</span>
      </div>

      <OutlinedIconLayout
        onClick={(e) => {
          e.stopPropagation();
          unblockUser.mutate(user.id);
        }}
      >
        <Close />
      </OutlinedIconLayout>
    </div>
  );
};

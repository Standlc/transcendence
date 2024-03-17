import { useContext, useMemo, useState } from "react";
import { SearchInput } from "../UIKit/SearchInput";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UserSearchResult } from "@api/types/clientSchema";
import { Spinner } from "../UIKit/Kit";
import { Avatar } from "../UIKit/avatar/Avatar";
import { PlayerRating } from "../UIKit/PlayerRating";
import { UserProfileContext } from "../ContextsProviders/UserProfileIdContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAddFriend } from "../utils/friends/useAddFriend";
import { useStartConversation } from "../utils/conversations/useStartConversation";
import { useGetUser } from "../utils/useGetUser";
import { useAcceptFriend } from "../utils/friends/useAcceptFriend";

export const AddFriendsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("query") ?? "");

  const userResults = useQuery({
    queryKey: ["userSearch", input],
    queryFn: async () => {
      if (input === "") return [];
      const res = await axios.get<UserSearchResult[]>(
        `/api/users/find?name=${input}`
      );
      return res.data;
    },
  });

  return (
    <div className="flex flex-col gap-5 w-full">
      <header className="flex flex-col text-left">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold">Make friends</h1>
        </div>
        <span className="opacity-50">
          Search people with their username. Start a conversation, play games
          together.
        </span>
      </header>

      <SearchInput
        input={input}
        autoFocus
        placeHolder="You can add friends with their username"
        onSearch={(value) => {
          userResults.refetch();
          searchParams.set("query", value);
          setSearchParams((prev) => prev);
          setInput(value);
        }}
      />

      {input !== "" && (
        <span className="opacity-50 text-left text-sm font-[600]">
          RESULTS — {userResults.data?.length ?? 0}
        </span>
      )}

      <div className="w-full flex flex-col gap-[2px]">
        {!userResults.data ? (
          <Spinner isLoading />
        ) : userResults.isError ? (
          <span>Error</span>
        ) : !userResults.data.length && input !== "" ? (
          <span className="opacity-50 text-lg">No results</span>
        ) : (
          userResults.data.map((user, i) => <UserResult key={i} user={user} />)
        )}
      </div>
    </div>
  );
};

type ActionType = {
  label: string;
  onClick?: () => any | void;
  color?: "gray" | "base" | "green";
  icon?: any;
  disbaled: () => boolean;
};

const UserResult = ({ user }: { user: UserSearchResult }) => {
  const currentUser = useGetUser();
  const { setUserProfileId } = useContext(UserProfileContext);
  const queryClient = useQueryClient();
  const addFriend = useAddFriend({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
    },
  });
  const acceptFriend = useAcceptFriend();
  const startConversation = useStartConversation();
  const navigate = useNavigate();

  const colorVariants = {
    gray: "bg-white bg-opacity-5",
    base: "bg-indigo-500",
    green: "bg-green-600",
  };

  const action = useMemo<ActionType>(() => {
    if (user.isFriends) {
      return {
        label: "Message",
        color: "base",
        onClick: () => {
          if (user.conversationId !== null) {
            navigate(`/home/dm/${user.conversationId}`);
          } else {
            startConversation.mutate(user.id);
          }
        },
        disbaled: () => startConversation.isPending,
      };
    }

    if (user.friendRequestSourceUserId === currentUser.id) {
      return {
        label: "Pending",
        disbaled: () => true,
        color: "gray",
      };
    } else if (user.friendRequestSourceUserId === user.id) {
      return {
        label: "Accept",
        color: "green",
        onClick: () => {
          acceptFriend.mutate(user.id);
        },
        disbaled: () => acceptFriend.isPending,
      };
    } else {
      return {
        label: "Add Friend",
        color: "green",
        onClick: () => {
          addFriend.mutate(user.id);
        },
        disbaled: () => addFriend.isPending,
      };
    }
  }, [user, currentUser.id]);

  return (
    <div
      onClick={() => setUserProfileId(user.id)}
      className="flex cursor-pointer items-center justify-between rounded-md hover:bg-opacity-5 bg-white bg-opacity-0 p-2"
    >
      <div className="flex gap-3 items-center">
        <Avatar
          borderRadius={1}
          imgUrl={user.avatarUrl}
          userId={user.id}
          size="md"
          status={user.status}
        />
        <span className="font-bold">{user.username}</span>
        <PlayerRating rating={user.rating} />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (action.onClick) {
            action.onClick();
          }
        }}
        disabled={action.disbaled()}
        className={`w-24 py-1 font-semibold text-sm flex items-center justify-center rounded-sm ${
          colorVariants[action.color ?? "base"]
        }`}
      >
        {action.label}
      </button>
    </div>
  );
};

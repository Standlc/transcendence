import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { FriendRequestUser, UserProfile } from "@api/types/clientSchema";
import { useGetUser } from "../useGetUser";

export const useAcceptFriend = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();
  const user = useGetUser();

  const updateUserProfile = (friendId: number) => {
    queryClient.setQueryData<UserProfile>(["userProfile", friendId], (prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        isFriends: true,
      };
    });
  };

  const updateFriendRequestsList = (friendId: number) => {
    queryClient.setQueryData<FriendRequestUser[]>(
      ["friendRequests"],
      (prev) => {
        return prev?.filter((user) => user.id !== friendId);
      }
    );
  };

  const updateFriendList = () => {
    queryClient.invalidateQueries({
      queryKey: ["friends", user.id],
    });
  };

  const acceptFriend = useMutation({
    mutationFn: async (userId: number) => {
      await axios.post(`/api/friends/accept?id=${userId}`);
      return userId;
    },
    onSuccess: (friendId: number) => {
      updateFriendList();
      updateFriendRequestsList(friendId);
      updateUserProfile(friendId);
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      addError({ message: "Friend request was accepted", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while accepting friend request" });
    },
  });

  return acceptFriend;
};

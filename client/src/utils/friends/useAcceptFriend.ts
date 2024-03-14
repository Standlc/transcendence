import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { UserProfile } from "@api/types/clientSchema";

export const useAcceptFriend = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const updateUserProfile = (friendId: number) => {
    queryClient.setQueryData<UserProfile>(["userProfile", friendId], (prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        isFriends: true,
      };
    });
  };

  const acceptFriend = useMutation({
    mutationFn: async (userId: number) => {
      await axios.post(`/api/friends/accept?id=${userId}`);
      return userId;
    },
    onSuccess: (friendId: number) => {
      // to do: add friend to other states
      updateUserProfile(friendId);
      addError({ message: "Friend request was accepted", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while accepting friend request" });
    },
  });

  return acceptFriend;
};

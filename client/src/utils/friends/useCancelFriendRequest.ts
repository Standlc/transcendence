import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { UserProfile } from "@api/types/clientSchema";

export const useCancelFriendRequest = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const updateUserProfile = (userId: number) => {
    queryClient.setQueryData<UserProfile>(["userProfile", userId], (prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        friendRequestSourceUserId: null,
      };
    });
  };

  const cancelFriendRequest = useMutation({
    mutationFn: async (userId: number) => {
      await axios.delete(`/api/friends/cancel?id=${userId}`);
      return userId;
    },
    onSuccess: (userId: number) => {
      // to do: add friend to other states
      updateUserProfile(userId);
      addError({ message: "Friend request was canceled", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while canceling friend request" });
    },
  });

  return cancelFriendRequest;
};

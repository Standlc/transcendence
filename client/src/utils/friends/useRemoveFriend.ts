import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { UserProfile } from "@api/types/clientSchema";

export const useRemoveFriend = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const updateUserProfile = (userId: number) => {
    queryClient.setQueryData<UserProfile>(["userProfile", userId], (prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        isFriends: false,
      };
    });
  };

  const removeFriend = useMutation({
    mutationFn: async (userId: number) => {
      await axios.delete(`/api/friends?id=${userId}`);
      return userId;
    },
    onSuccess: (userId: number) => {
      // to do: add friend to other states
      updateUserProfile(userId);
      addError({ message: "Friend was removed", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while removing friend" });
    },
  });

  return removeFriend;
};

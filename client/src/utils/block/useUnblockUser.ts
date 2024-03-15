import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { BlockedUser, UserProfile } from "@api/types/clientSchema";

export const useUnblockUser = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const updateUserProfile = (blockedUserId: number) => {
    queryClient.setQueryData<UserProfile>(
      ["userProfile", blockedUserId],
      (prev) => {
        if (!prev) return undefined;
        return {
          ...prev,
          isBlocked: false,
        };
      }
    );
  };

  const removeFromBlockedUsers = (userId: number) => {
    queryClient.setQueryData<BlockedUser[]>(["blockedUsers"], (prev) => {
      if (!prev) return undefined;
      return prev.filter((user) => user.id !== userId);
    });
  };

  const blockUser = useMutation({
    mutationFn: async (userId: number) => {
      await axios.post(`/api/blocked-user/unblock?blockedId=${userId}`);
      return userId;
    },
    onSuccess: (userId: number) => {
      removeFromBlockedUsers(userId);
      updateUserProfile(userId);
      addError({ message: "User was unblocked", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while unblocking user" });
    },
  });

  return blockUser;
};

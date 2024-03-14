import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { UserProfile } from "@api/types/clientSchema";

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

  const blockUser = useMutation({
    mutationFn: async (userId: number) => {
      await axios.post(`/api/blocked-user/unblock?blockedId=${userId}`);
      return userId;
    },
    onSuccess: (blockedUserId: number) => {
      updateUserProfile(blockedUserId);
      addError({ message: "User was unblocked", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while unblocking user" });
    },
  });

  return blockUser;
};

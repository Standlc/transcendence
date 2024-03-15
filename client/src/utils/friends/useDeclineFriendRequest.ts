import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { FriendRequestUser, UserProfile } from "@api/types/clientSchema";

export const useDeclineFriendRequest = () => {
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

  const removeFriendRequestFromList = (userId: number) => {
    queryClient.setQueryData<FriendRequestUser[]>(
      ["friendRequests"],
      (prev) => {
        return prev?.filter((user) => user.id !== userId);
      }
    );
  };

  const declineFriendRequest = useMutation({
    mutationFn: async (userId: number) => {
      await axios.delete(`/api/friends/deny?id=${userId}`);
      return userId;
    },
    onSuccess: (userId: number) => {
      removeFriendRequestFromList(userId);
      updateUserProfile(userId);
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      addError({ message: "Friend request was declined", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while declining friend request" });
    },
  });

  return declineFriendRequest;
};

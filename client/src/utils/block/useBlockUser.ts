import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import {
  FriendRequestUser,
  UserFriend,
  UserProfile,
} from "@api/types/clientSchema";
import { useGetUser } from "../useGetUser";

export const useBlockUser = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();
  const user = useGetUser();

  const updateUserProfile = (blockedUserId: number) => {
    queryClient.setQueryData<UserProfile>(
      ["userProfile", blockedUserId],
      (prev) => {
        if (!prev) return undefined;
        return {
          ...prev,
          isBlocked: true,
          isFriends: false,
          friendRequestSourceUserId: null,
        };
      }
    );
  };

  const removeFriendFromFriendsList = (blockedUserId: number) => {
    queryClient.setQueryData<UserFriend[]>(["friends", user.id], (prev) => {
      if (!prev) return undefined;
      return prev.filter((friend) => friend.id !== blockedUserId);
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

  const blockUser = useMutation({
    mutationFn: async (userId: number) => {
      await axios.post(`/api/blocked-user/block?blockedId=${userId}`);
      return userId;
    },
    onSuccess: (blockedUserId: number) => {
      removeFriendFromFriendsList(blockedUserId);
      removeFriendRequestFromList(blockedUserId);
      updateUserProfile(blockedUserId);
      addError({ message: "User was blocked", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while blocking user" });
    },
  });

  return blockUser;
};

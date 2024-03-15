import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { UserFriend, UserProfile } from "@api/types/clientSchema";
import { useGetUser } from "../useGetUser";
import { AllUserDm } from "../../types/allUserDm";

export const useRemoveFriend = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();
  const user = useGetUser();

  const updateUserProfile = (userId: number) => {
    queryClient.setQueryData<UserProfile>(["userProfile", userId], (prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        isFriends: false,
      };
    });
  };

  const removeFriendFromFriendsList = (userId: number) => {
    queryClient.setQueryData<UserFriend[]>(["friends", user.id], (prev) => {
      if (!prev) return undefined;
      return prev.filter((friend) => friend.id !== userId);
    });
  };

  const removeConversation = (userId: number) => {
    queryClient.setQueryData<AllUserDm[]>(["conversations"], (prev) => {
      return prev?.filter(
        (conv) => conv.user1.userId !== userId && conv.user2.userId !== userId
      );
    });
  };

  const removeFriend = useMutation({
    mutationFn: async (userId: number) => {
      await axios.delete(`/api/friends?id=${userId}`);
      return userId;
    },
    onSuccess: (userId: number) => {
      removeFriendFromFriendsList(userId);
      updateUserProfile(userId);
      removeConversation(userId);
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      addError({ message: "Friend was removed", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while removing friend" });
    },
  });

  return removeFriend;
};

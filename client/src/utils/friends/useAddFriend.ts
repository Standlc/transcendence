import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { UserProfile } from "@api/types/clientSchema";
import { useGetUser } from "../useGetUser";

export const useAddFriend = (props?: {
  onSuccess: (userId: number) => void;
}) => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();
  const user = useGetUser();

  const updateUserProfile = (friendId: number) => {
    queryClient.setQueryData<UserProfile>(["userProfile", friendId], (prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        friendRequestSourceUserId: user.id,
      };
    });
  };

  const addFriendToFriendsList = () => {
    queryClient.invalidateQueries({ queryKey: ["friends", user.id] });
  };

  const addFriend = useMutation({
    mutationFn: async (userId: number) => {
      await axios.post(`/api/friends/request?id=${userId}`);
      return userId;
    },
    onSuccess: (friendId: number) => {
      props && props.onSuccess(friendId);
      addFriendToFriendsList();
      updateUserProfile(friendId);
      addError({ message: "Friend request was sent", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while sending friend request" });
    },
  });

  return addFriend;
};

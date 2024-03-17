import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useLeaveChannel = () => {
  const { addError } = useContext(ErrorContext);

  const leaveChannel = useMutation({
    mutationFn: async (channelId: number) => {
      await axios.delete(`/api/channels/leave/${channelId}`);
      return channelId;
    },
    onSuccess: () => {
      // queryClient.setQueryData<UserChannel[]>(["channels"], (prev) => {
      //   return prev?.filter((c) => c.id !== channelId);
      // });
    },
    onError: () => {
      addError({ message: "Error while leaving the channel" });
    },
  });

  return leaveChannel;
};

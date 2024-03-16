import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  const { addError } = useContext(ErrorContext);

  const deleteChannel = useMutation({
    mutationFn: async (channelId: number) => {
      await axios.delete(`/api/channels/delete/${channelId}`);
      return channelId;
    },
    onSuccess: (channelId: number) => {
      addError({ message: "Channel was deleted", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while deleting channel" });
    },
  });

  return deleteChannel;
};

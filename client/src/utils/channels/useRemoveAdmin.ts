import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { ChannelAndUserIdPayload } from "@api/types/channelsSchema";

export const useRemoveAdmin = () => {
  const queryClient = useQueryClient();
  const { addError } = useContext(ErrorContext);

  const removeAdmin = useMutation({
    mutationFn: async (payload: ChannelAndUserIdPayload) => {
      await axios.post(`/api/channels/remove-admin`, payload);
      return payload;
    },
    onSuccess: (payload: ChannelAndUserIdPayload) => {
      addError({ message: "Member is not admin anymore", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while changing member's admin rights" });
    },
  });

  return removeAdmin;
};

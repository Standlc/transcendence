import { ChannelAndUserIdPayload } from "@api/types/channelsSchema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useMuteMember = () => {
  const queryClient = useQueryClient();
  const { addError } = useContext(ErrorContext);

  const muteMember = useMutation({
    mutationFn: async (payload: ChannelAndUserIdPayload) => {
      await axios.post(`/api/channels/mute`, payload);
      return payload;
    },
    onSuccess: (payload: ChannelAndUserIdPayload) => {
      addError({ message: "User was muted", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while muting member" });
    },
  });

  return muteMember;
};

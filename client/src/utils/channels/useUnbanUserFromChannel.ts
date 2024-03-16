import { ChannelAndUserIdPayload } from "@api/types/channelsSchema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useUnbanUserFromChannel = () => {
  const queryClient = useQueryClient();
  const { addError } = useContext(ErrorContext);

  const unbanMember = useMutation({
    mutationFn: async (payload: ChannelAndUserIdPayload) => {
      await axios.post(`/api/channels/unban`, payload);
      return payload;
    },
    onSuccess: (payload: ChannelAndUserIdPayload) => {
      // to do: invalidate channel query
    },
    onError: () => {
      addError({ message: "Error while unbanning user from channel" });
    },
  });

  return unbanMember;
};

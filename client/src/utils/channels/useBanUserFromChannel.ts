import { ChannelAndUserIdPayload } from "@api/types/channelsSchema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useBanUserFromChannel = () => {
  const queryClient = useQueryClient();
  const { addError } = useContext(ErrorContext);

  const banMember = useMutation({
    mutationFn: async (payload: ChannelAndUserIdPayload) => {
      await axios.post(`/api/channels/ban`, payload);
      return payload;
    },
    onSuccess: (payload: ChannelAndUserIdPayload) => {
      addError({ message: "User was banned", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while banning user from channel" });
    },
  });

  return banMember;
};

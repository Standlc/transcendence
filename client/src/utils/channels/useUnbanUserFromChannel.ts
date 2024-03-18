import { ChannelAndUserIdPayload } from "@api/types/channelsSchema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useUnbanUserFromChannel = (props?: {
  onSuccess: (userId: ChannelAndUserIdPayload) => void;
}) => {
  const { addError } = useContext(ErrorContext);

  const unbanMember = useMutation({
    mutationFn: async (payload: ChannelAndUserIdPayload) => {
      await axios.post(`/api/channels/unban`, payload);
      return payload;
    },
    onSuccess: (payload: ChannelAndUserIdPayload) => {
      props && props.onSuccess(payload);
      addError({ message: "User was banned from channel", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while unbanning user from channel" });
    },
  });

  return unbanMember;
};

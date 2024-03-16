import { ChannelUpdate } from "@api/types/channelsSchema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useUpdateChannel = (props?: { onSuccess: () => void }) => {
  const { addError } = useContext(ErrorContext);

  const updateChannel = useMutation({
    mutationFn: async (payload: ChannelUpdate & { channelId: number }) => {
      const { channelId, ...other } = payload;
      await axios.put(`/api/channels/${payload.channelId}`, other);
      return payload;
    },
    onSuccess: (channelUpdates: ChannelUpdate) => {
      addError({ message: "Channel was updated" });
      props?.onSuccess && props.onSuccess();
    },
    onError: () => {
      addError({ message: "Error while updating channel" });
    },
  });

  return updateChannel;
};

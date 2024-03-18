import { ChannelAndUserIdPayload } from "@api/types/channelsSchema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { useContext } from "react";

export const useAddUserToChannel = (props?: { onSuccess: () => void }) => {
  const { addError } = useContext(ErrorContext);

  const addUser = useMutation({
    mutationFn: async (payload: ChannelAndUserIdPayload) => {
      const res = await axios.post(`/api/channels/add-member`, payload);
      return res.data;
    },
    onSuccess: () => {
      addError({ message: "User was added to the channel", isSuccess: true });
      props && props.onSuccess();
    },
    onError: () => {
      addError({ message: "Error while adding user to the channel" });
    },
  });

  return addUser;
};

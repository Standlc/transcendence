import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { ChannelAndUserIdPayload } from "@api/types/channelsSchema";

export const useAddAdmin = () => {
  const queryClient = useQueryClient();
  const { addError } = useContext(ErrorContext);

  const addAdmin = useMutation({
    mutationFn: async (payload: ChannelAndUserIdPayload) => {
      await axios.post(`/api/channels/add-admin`, payload);
      return payload;
    },
    onSuccess: (payload: ChannelAndUserIdPayload) => {
      addError({ message: "Member is now admin", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while making member admin" });
    },
  });

  return addAdmin;
};

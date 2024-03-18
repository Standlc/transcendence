import { ChannelCreationData } from "@api/types/channelsSchema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { useNavigate } from "react-router-dom";

export const useCreateChannel = (props?: {
  onSuccess: (channelId: number) => void;
}) => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createChannel = useMutation({
    mutationFn: async (payload: ChannelCreationData) => {
      const res = await axios.post<number>(`/api/channels`, payload);
      return res.data;
    },
    onSuccess: (channelId: number) => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      props?.onSuccess && props?.onSuccess(channelId);
      navigate(`/home/channels/${channelId}`);
    },
    onError: () => {
      addError({ message: "Error while creating channel" });
    },
  });

  return createChannel;
};

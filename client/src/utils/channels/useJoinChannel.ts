import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChannelJoinDto, PublicChannel } from "@api/types/channelsSchema";

export const useJoinChannel = () => {
  const navigate = useNavigate();
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const joinChannel = useMutation({
    mutationFn: async (payload: ChannelJoinDto) => {
      await axios.post(`/api/channels/join`, payload);
      return payload.channelId;
    },
    onSuccess: (channelId) => {
      queryClient.setQueryData(
        ["publicChannels"],
        (prev: PublicChannel[] | undefined) => {
          if (!prev) return undefined;
          return prev.map((c) => {
            if (c.id === channelId) {
              return {
                ...c,
                isMember: true,
              };
            }
            return c;
          });
        }
      );
      navigate(`/home/channels/${channelId}`);
    },
    onError: (error) => {
      addError({ message: error.message });
    },
  });

  return joinChannel;
};

import { ChannelBannedUser } from "@api/types/channelsSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetChannelBannedUsers = (channelId: number) => {
  const bannedUsers = useQuery({
    queryKey: ["channelBannedUsers", channelId],
    queryFn: async () => {
      const res = await axios.get<ChannelBannedUser[]>(
        `/api/channels/banned/${channelId}`
      );
      return res.data;
    },
  });

  return bannedUsers;
};

import { ChannelDataWithUsersWithoutPassword } from "@api/types/channelsSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetChannel = (channelId: number) => {
  const channel = useQuery<ChannelDataWithUsersWithoutPassword>({
    queryKey: ["channel", channelId],
    queryFn: async () => {
      const response = await axios.get(`/api/channels/${channelId}/channel`);
      return response.data;
    },
  });

  return channel;
};

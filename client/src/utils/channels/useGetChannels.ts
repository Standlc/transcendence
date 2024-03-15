import { UserChannel } from "@api/types/channelsSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetChannels = () => {
  const channels = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await axios.get<UserChannel[]>("/api/channels");
      return res.data;
    },
  });

  return channels;
};

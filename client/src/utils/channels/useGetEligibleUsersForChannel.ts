import { EligibleUserForChannel } from "@api/types/channelsSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetEligibleUsersForChannel = (channelId: number) => {
  const users = useQuery({
    queryKey: ["eligibleUsers", channelId],
    queryFn: async () => {
      const res = await axios.get<EligibleUserForChannel[]>(
        `/api/channels/eligible-users/${channelId}`
      );
      return res.data;
    },
  });

  return users;
};

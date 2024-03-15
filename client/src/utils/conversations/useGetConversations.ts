import { UserConversationType } from "@api/types/channelsSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetConversations = () => {
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axios.get<UserConversationType[]>("/api/dm");
      return res.data;
    },
  });

  return conversations;
};

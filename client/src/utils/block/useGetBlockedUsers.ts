import { BlockedUser } from "@api/types/clientSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetBlockedUsers = () => {
  const blockedUsers = useQuery<BlockedUser[]>({
    queryKey: ["blockedUsers"],
    queryFn: async () => {
      const res = await axios.get("/api/blocked-user/list");
      return res.data;
    },
  });

  return blockedUsers;
};

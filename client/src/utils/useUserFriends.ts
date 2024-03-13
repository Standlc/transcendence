import { AppUser } from "@api/types/clientSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useUserFriends = (userId: number) => {
  const friends = useQuery({
    queryKey: ["userFriends", userId],
    queryFn: async () => {
      const res = await axios.get<AppUser[]>(`/api/friends?id=${userId}`);
      return res.data;
    },
  });
  return friends;
};

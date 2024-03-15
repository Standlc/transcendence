import { UserFriend } from "@api/types/clientSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetFriends = (userId: number) => {
  const friends = useQuery<UserFriend[]>({
    queryKey: ["friends", userId],
    queryFn: async () => {
      const res = await axios.get(`/api/friends?id=${userId}`);
      return res.data;
    },
  });

  return friends;
};

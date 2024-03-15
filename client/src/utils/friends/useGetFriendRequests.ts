import { FriendRequestUser } from "@api/types/clientSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetFriendRequests = () => {
  const friendRequests = useQuery<FriendRequestUser[]>({
    queryKey: ["friendRequests"],
    queryFn: async () => {
      const res = await axios.get("/api/friends/requests");
      return res.data;
    },
  });

  return friendRequests;
};

import { AppUser } from "@api/types/clientSchema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetAuthToken = () => {
  const user = useQuery({
    queryKey: ["user"],
    retry: false,
    queryFn: async () => {
      const res = await axios.get<AppUser>("/api/auth/token");
      return res.data;
    },
  });

  return user;
};

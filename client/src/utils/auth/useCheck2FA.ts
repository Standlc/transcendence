import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useCheck2FA = () => {
  const login = useQuery({
    queryKey: ["check2FA"],
    queryFn: async () => {
      const response = await axios.get("/api/auth/2fa/check");
      return response.data;
    },
  });

  return login;
};

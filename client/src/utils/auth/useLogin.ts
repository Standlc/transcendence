import { AppUser } from "@api/types/clientSchema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useLogin = ({
  onSuccess,
  onError,
}: {
  onSuccess: (data: Partial<AppUser>) => void;
  onError: (err: any) => void;
}) => {
  const login = useMutation<
    Partial<AppUser>,
    any,
    { username: string; password: string }
  >({
    mutationFn: async ({ username, password }) => {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (err) => {
      onError(err);
    },
  });

  return login;
};

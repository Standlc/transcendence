import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../ContextsProviders/ErrorContext";

export const useCancelGameRequest = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const cancel = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/api/game-requests`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["currentGameRequest"], null);
    },
    onError: () => {
      queryClient.setQueryData(["currentGameRequest"], null);
      addError({ message: "Error while deleting the game request" });
    },
  });

  return cancel;
};

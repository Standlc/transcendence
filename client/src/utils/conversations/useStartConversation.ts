import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { useNavigate } from "react-router-dom";

export const useStartConversation = () => {
  const { addError } = useContext(ErrorContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const startConversation = useMutation({
    mutationFn: async (targetId: number) => {
      const res = await axios.post<number>(`/api/dm`, {
        userId: targetId,
      });
      return res.data;
    },
    onSuccess: (conversationId: number) => {
      navigate(`/home/dm/${conversationId}`);
      // to do: invalidate conversation query
      // queryClient.invalidateQueries();
    },
    onError: () => {
      addError({ message: "Error while starting conversation" });
    },
  });

  return startConversation;
};

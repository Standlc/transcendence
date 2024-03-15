import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";
import { AllUserDm } from "../../types/allUserDm";

export const useDeleteConversation = () => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const updateConversationList = (deletedConvId: number) => {
    queryClient.setQueryData<AllUserDm[]>(["conversations"], (prev) => {
      return prev?.filter((conv) => conv.id !== deletedConvId);
    });
  };

  const deleteConversation = useMutation({
    mutationFn: async (conversationId: number) => {
      await axios.delete(`/api/dm/${conversationId}`);
      return conversationId;
    },
    onSuccess: (deletedConversationId: number) => {
      updateConversationList(deletedConversationId);
      addError({ message: "Conversation was deleted", isSuccess: true });
    },
    onError: () => {
      addError({ message: "Error while deleting conversation" });
    },
  });

  return deleteConversation;
};

import { Socket, io } from "socket.io-client";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { useEffect, useState } from "react";
import { DmGatewayEmitTypes } from "@api/types/conversations";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

export const useConversationSocket = (addError: (error: ErrorType) => void) => {
  const [conversationSocket, setConversationSocket] = useState<Socket>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { dmId } = useParams();

  useEffect(() => {
    const connection = io("/dm");
    setConversationSocket(connection);

    return () => {
      connection.disconnect();
      setConversationSocket(undefined);
    };
  }, []);

  useEffect(() => {
    if (!conversationSocket) return;

    const handleErrors = (err: Error) => {
      conversationSocket.disconnect();
      setConversationSocket(undefined);
      addError({ message: err.message });
    };

    const handleDisconnect = () => {
      setConversationSocket(undefined);
      console.log("disconnected by server");
    };

    const handleNewConversation = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleConversationDeleted = (
      conversationId: DmGatewayEmitTypes["conversationDeleted"]
    ) => {
      if (dmId === conversationId.toString()) {
        navigate("/home");
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    conversationSocket.on("disconnect", handleDisconnect);
    conversationSocket.on("connect_error", handleErrors);
    conversationSocket.on("connect_failed", handleErrors);
    conversationSocket.on("newConversation", handleNewConversation);
    conversationSocket.on("conversationDeleted", handleConversationDeleted);

    return () => {
      conversationSocket.off("disconnect");
      conversationSocket.off("connect_error");
      conversationSocket.off("connect_failed");
      conversationSocket.off("newConversation", handleNewConversation);
      conversationSocket.off("conversationDeleted", handleConversationDeleted);
    };
  }, [conversationSocket, queryClient, navigate, dmId]);

  return conversationSocket;
};

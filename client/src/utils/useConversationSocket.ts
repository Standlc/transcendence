import { Socket, io } from "socket.io-client";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useGetUser } from "./useGetUser";

export const useConversationSocket = (addError: (error: ErrorType) => void) => {
  const [conversationSocket, setConversationSocket] = useState<Socket>();
  // const queryClient = useQueryClient();
  // const navigate = useNavigate();
  // const user = useGetUser();

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
      // redirect to login page
      conversationSocket.disconnect();
      setConversationSocket(undefined);
      addError({ message: err.message });
    };

    const handleDisconnect = () => {
      // redirect to login page
      setConversationSocket(undefined);
      console.log("disconnected by server");
    };

    conversationSocket.on("disconnect", handleDisconnect);
    conversationSocket.on("connect_error", handleErrors);
    conversationSocket.on("connect_failed", handleErrors);

    return () => {
      conversationSocket.off("disconnect");
      conversationSocket.off("connect_error");
      conversationSocket.off("connect_failed");
    };
  }, [conversationSocket]);

  return conversationSocket;
};

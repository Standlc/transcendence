import { useEffect, useState } from "react";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { Socket, io } from "socket.io-client";

export const useChatSocket = (addError: (error: ErrorType) => void) => {
  const [chatSocket, setChatSocket] = useState<Socket>();

  useEffect(() => {
    const connection = io("/channel");
    setChatSocket(connection);

    return () => {
      connection.disconnect();
      setChatSocket(undefined);
    };
  }, []);

  useEffect(() => {
    if (!chatSocket) return;

    const handleErrors = (err: Error) => {
      // redirect to login page
      chatSocket.disconnect();
      setChatSocket(undefined);
      addError({ message: err.message });
    };

    const handleDisconnect = () => {
      // redirect to login page
      setChatSocket(undefined);
      console.log("disconnected by server");
    };

    chatSocket.on("disconnect", handleDisconnect);
    chatSocket.on("connect_error", handleErrors);
    chatSocket.on("connect_failed", handleErrors);
    return () => {
      chatSocket.off("disconnect", handleDisconnect);
      chatSocket.off("connect_error", handleErrors);
      chatSocket.off("connect_failed", handleErrors);
    };
  }, [chatSocket]);
  return { chatSocket };
};

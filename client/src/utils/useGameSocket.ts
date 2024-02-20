import { Socket, io } from "socket.io-client";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { useEffect, useState } from "react";

export const useGameSocket = (addError: (error: ErrorType) => void) => {
  const [gameSocket, setGameSocket] = useState<Socket>();

  useEffect(() => {
    const connection = io();
    setGameSocket(connection);
    return () => {
      connection.disconnect();
      setGameSocket(undefined);
    };
  }, []);

  useEffect(() => {
    if (!gameSocket) return;

    const handleErrors = (err: Error) => {
      gameSocket.disconnect();
      setGameSocket(undefined);
      addError({ message: err.message });
    };

    const handleServerError = (message: string) => {
      console.log(message);
      addError({ message: "something went wrong with the game server" });
    };

    gameSocket.on("connect_error", handleErrors);
    gameSocket.on("connect_failed", handleErrors);
    gameSocket.on("error", handleServerError);
    return () => {
      if (!gameSocket) return;
      gameSocket.off("connect_error", handleErrors);
      gameSocket.off("connect_failed", handleErrors);
      gameSocket.off("error", handleServerError);
    };
  }, [gameSocket]);

  return gameSocket;
};

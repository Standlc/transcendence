import { EmitPayloadType as GameServerEventTypes } from "@api/types/gameServer/socketPayloadTypes";
import { Socket, io } from "socket.io-client";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const useGameSocket = (addError: (error: ErrorType) => void) => {
  const [gameSocket, setGameSocket] = useState<Socket>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

    const handleGameStart = (gameId: string) => {
      navigate(`/play/${gameId}`);
      console.log("start", `/play/${gameId}`);
      queryClient.setQueryData(["currentGameRequest"], null);
    };

    gameSocket.on("connect_error", handleErrors);
    gameSocket.on("connect_failed", handleErrors);
    gameSocket.on("error", handleServerError);
    gameSocketOn("gameStart", handleGameStart);
    return () => {
      if (!gameSocket) return;
      gameSocket.off("connect_error", handleErrors);
      gameSocket.off("connect_failed", handleErrors);
      gameSocket.off("error", handleServerError);
      gameSocketOff("gameStart", handleGameStart);
    };
  }, [gameSocket]);

  const gameSocketOn = useCallback(
    <T extends keyof GameServerEventTypes>(
      ev: T,
      handler: (data: GameServerEventTypes[T]) => void
    ) => {
      if (gameSocket) {
        gameSocket.on(ev, handler as any);
      }
    },
    [gameSocket]
  );

  const gameSocketOff = useCallback(
    <T extends keyof GameServerEventTypes>(
      ev: T,
      handler: (data: GameServerEventTypes[T]) => void
    ) => {
      if (gameSocket) {
        gameSocket.off(ev, handler as any);
      }
    },
    [gameSocket]
  );

  return {
    gameSocket,
    gameSocketOn,
    gameSocketOff,
  };
};

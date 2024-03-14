import { EmitPayloadType as GameServerEventTypes } from "@api/types/gameServer/socketPayloadTypes";
import { Socket, io } from "socket.io-client";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UserGame } from "@api/types/games";

export const useGameSocket = (addError: (error: ErrorType) => void) => {
  const [gameSocket, setGameSocket] = useState<Socket>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchGameRecord = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await axios.get<UserGame>(`/api/games/${gameId}`);
      return res.data;
    },
    onSuccess: (gameRecord) => {
      queryClient.setQueryData(["currentGame"], gameRecord);
      queryClient.setQueryData(["gameRecord", gameRecord.id], gameRecord);
    },
    onError: (error) => {
      console.log(error);
      addError({ message: error.message });
    },
  });

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
      // redirect to login page
      gameSocket.disconnect();
      setGameSocket(undefined);
      addError({ message: err.message });
    };

    const handleServerError = (message: string) => {
      console.log(message);
      setGameSocket(undefined);
      addError({ message: "something went wrong with the game server" });
    };

    const handleGameStart = (gameId: string) => {
      navigate(`/play/game/${gameId}`);
      queryClient.setQueryData(["currentGameRequest"], null);

      const gameIdToNumber = Number(gameId);
      if (!isNaN(gameIdToNumber)) {
        fetchGameRecord.mutate(gameIdToNumber);
      }
    };

    const handleDisconnect = () => {
      // console.log("disconnected by server");
      setGameSocket(undefined);
    };

    gameSocket.on("disconnect", handleDisconnect);
    gameSocket.on("connect_error", handleErrors);
    gameSocket.on("connect_failed", handleErrors);
    gameSocket.on("error", handleServerError);
    gameSocketOn("gameStart", handleGameStart);

    return () => {
      if (!gameSocket) return;
      gameSocket.off("disconnect", handleDisconnect);
      gameSocket.off("connect_error", handleErrors);
      gameSocket.off("connect_failed", handleErrors);
      gameSocket.off("error", handleServerError);
      gameSocketOff("gameStart", handleGameStart);
    };
  }, [gameSocket, queryClient, navigate, gameSocketOn, gameSocketOff]);

  return {
    gameSocket,
    gameSocketOn,
    gameSocketOff,
  };
};

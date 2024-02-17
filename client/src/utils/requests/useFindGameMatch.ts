import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  AppGameRequest,
  PublicGameRequestDto,
} from "../../../../api/src/types/games/gameRequestsDto";
import { useContext, useEffect, useState } from "react";
import { GameSocketContext } from "../../ContextsProviders/GameSocketContext";
import { useNavigate } from "react-router-dom";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useFindGameMatch = (preferences: PublicGameRequestDto) => {
  const socket = useContext(GameSocketContext);
  const { addError } = useContext(ErrorContext);
  const navigate = useNavigate();
  const [isFindingGame, setIsFindingGame] = useState(false);

  const currentGameRequest = useQuery({
    queryFn: async () => {
      const res = await axios.get<AppGameRequest | undefined>(
        "/api/game-requests"
      );
      return res.data;
    },
    queryKey: ["currentGameRequest"],
  });

  const findGame = useMutation({
    mutationKey: ["findMatch", preferences],
    mutationFn: async () => {
      setIsFindingGame(true);
      const payload: PublicGameRequestDto = {
        points: preferences.points,
        powerUps: preferences.powerUps,
      };
      const res = await axios.post<any>("/api/game-requests", payload);
      return res.data;
    },
  });

  const cancel = useMutation({
    mutationKey: ["cancelGameRequest"],
    mutationFn: async () => {
      setIsFindingGame(false);
      const res = await axios.delete(`/api/game-requests`);
      return res.data;
    },
    onError: () => {
      addError({ message: "something went wrong" });
    },
  });

  useEffect(() => {
    if (!currentGameRequest.isError && currentGameRequest.data) {
      setIsFindingGame(true);
    }
  }, [currentGameRequest]);

  useEffect(() => {
    const handleGameStart = (gameId: string) => {
      setIsFindingGame(false);
      navigate(`/play/${gameId}`);
    };

    socket.on("gameStart", handleGameStart);
    return () => {
      socket.off("gameStart", handleGameStart);
    };
  }, [socket]);

  return { findGame, cancel, isFindingGame };
};

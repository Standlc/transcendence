import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  UserGameRequest,
  PublicGameRequestDto,
} from "../../../api/src/types/gameRequests";
import { useContext } from "react";
import { ErrorContext } from "../ContextsProviders/ErrorContext";

export const useFindGameMatch = (preferences: PublicGameRequestDto) => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const findGame = useMutation({
    mutationKey: ["findMatch", preferences],
    mutationFn: async () => {
      const payload: PublicGameRequestDto = {
        points: preferences.points,
        powerUps: preferences.powerUps,
      };
      const res = await axios.post<UserGameRequest | undefined>(
        "/api/game-requests",
        payload
      );
      queryClient.setQueryData(["currentGameRequest"], res.data);
      return res.data;
    },
    onError: () => {
      addError({ message: "Error while making game request" });
    },
  });

  return findGame;
};

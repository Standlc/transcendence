import { UserGame } from "@api/types/games";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useFetchGame = (gameId: number) => {
  const gameRecord = useQuery({
    queryFn: async () => {
      if (isNaN(gameId)) {
        return null;
      }
      const res = await axios.get<UserGame>(`/api/games/${gameId}`);
      return res.data;
    },
    queryKey: ["gameRecord", gameId],
  });

  return gameRecord;
};

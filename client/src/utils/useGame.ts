import { UserGame } from "@api/types/games";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "react-router-dom";

export const useGame = () => {
  const { gameId } = useParams();

  const gameRecord = useQuery({
    queryFn: async () => {
      if (!gameId) return null;
      const res = await axios.get<UserGame>(`/api/games/${Number(gameId)}`);
      return res.data;
    },
    queryKey: ["gameRecord", gameId],
  });

  return gameRecord;
};

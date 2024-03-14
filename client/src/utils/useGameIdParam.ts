import { useMemo } from "react";
import { useParams } from "react-router-dom";

export const useGameIdParam = () => {
  const { gameId } = useParams();
  const gameIdToNumber = useMemo(() => Number(gameId), [gameId]);
  return { gameId: gameIdToNumber, isGamePage: !isNaN(gameIdToNumber) };
};

import { useContext, useMemo } from "react";
import { GameStateType } from "../../../../api/src/types/game";
import { UserContext } from "../../contextsProviders/UserContext";

export const getGamePlayers = (
  game: GameStateType | undefined,
  userId: number
) => {
  if (!game) return undefined;

  if (game.playerLeft.id === userId || game.playerRight.id !== userId) {
    return {
      left: game.playerLeft,
      right: game.playerRight,
    };
  }
  return {
    left: game.playerRight,
    right: game.playerLeft,
  };
};

export const useGamePlayers = (game: GameStateType | undefined) => {
  const { user } = useContext(UserContext);

  const players = useMemo(
    () => getGamePlayers(game, user.id),
    [game?.playerLeft, game?.playerRight, user.id]
  );

  return players;
};

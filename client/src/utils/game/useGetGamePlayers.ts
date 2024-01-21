import { useContext, useMemo } from "react";
import { GameStateType } from "../../../../api/src/types/game";
import { UserContext } from "../../ContextsProviders/UserContext";

export const getGamePlayers = (game: GameStateType, userId: number) => {
  if (game.playerLeft.userId === userId || game.playerRight.userId !== userId) {
    return {
      playerLeft: game.playerLeft,
      playerRight: game.playerRight,
    };
  }
  return {
    playerLeft: game.playerRight,
    playerRight: game.playerLeft,
  };
};

export const useGamePlayers = (game: GameStateType) => {
  const { user } = useContext(UserContext);

  const players = useMemo(
    () => getGamePlayers(game, user.id),
    [game.playerLeft, game.playerRight, user.id]
  );

  return players;
};

import { useContext, useMemo } from "react";
import { GameStateType } from "../../../../api/src/types/game";
import { UserContext } from "../../contextsProviders/UserContext";

export const getGamePlayers = (
  game: GameStateType | undefined,
  userId: number
) => {
  if (!game) return undefined;

  if (game.playerOne.id === userId || game.playerTwo.id !== userId) {
    return {
      left: game.playerOne,
      right: game.playerTwo,
    };
  }
  return {
    left: game.playerTwo,
    right: game.playerOne,
  };
};

export const useGamePlayers = (game: GameStateType | undefined) => {
  const { user } = useContext(UserContext);

  const players = useMemo(
    () => getGamePlayers(game, user.id),
    [game?.playerOne, game?.playerTwo, user.id]
  );

  return players;
};

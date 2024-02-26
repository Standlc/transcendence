import { GameStateType, GameType } from 'src/types/gameServer/pongGameTypes';

export const getOtherPlayer = (game: GameStateType, userId: number) => {
  return game.playerOne.id === userId ? game.playerTwo : game.playerOne;
};

export const getWinner = (gameState: GameType) => {
  const { playerOne, playerTwo } = gameState.game;
  if (gameState.userDisconnectedId !== undefined) {
    return {
      winner:
        playerOne.id === gameState.userDisconnectedId ? playerTwo : playerOne,
      loser:
        playerOne.id === gameState.userDisconnectedId ? playerOne : playerTwo,
    };
  }
  if (playerOne.score > playerTwo.score) {
    return { winner: playerOne, loser: playerTwo };
  }
  return { winner: playerTwo, loser: playerOne };
};

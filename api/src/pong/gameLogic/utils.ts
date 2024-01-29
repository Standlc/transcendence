import { GameStateType, GameType } from 'src/types/games/pongGameTypes';

export const getOtherPlayer = (game: GameStateType, userId: number) => {
  return game.playerOne.id === userId ? game.playerTwo : game.playerOne;
};

export const getWinnerId = (gameState: GameType) => {
  const { playerOne, playerTwo } = gameState.game;
  if (gameState.userIdBeingDisconnected !== undefined) {
    return getOtherPlayer(gameState.game, gameState.userIdBeingDisconnected).id;
  }
  if (playerOne.score > playerTwo.score) {
    return playerOne.id;
  }
  return playerTwo.id;
};

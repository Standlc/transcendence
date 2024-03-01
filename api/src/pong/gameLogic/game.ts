import { Selectable } from 'kysely';
import {
  GameType,
  POWER_UPS,
  PlayerType,
  BallType,
  GameStateType,
} from '../../types/gameServer/pongGameTypes';
import { Game } from 'src/types/schema';
import {
  BALL_SIZE,
  CANVAS_H,
  CANVAS_W,
  INTERVAL_S,
  INTERVAL_MS,
  BALL_ACCELERATION,
} from './constants';
import { BALL_HIT_TYPE, bounceBallAndMovePaddles } from './bounceBall';
import {
  BALL_VELOCITY_X,
  BALL_VELOCITY_X_FIRST_THROW,
  BALL_VELOCITY_X_MAX,
  BALL_VELOCITY_Y,
  BALL_VELOCITY_Y_FIRST_THROW,
  THROW_BALL_TIMEMOUT,
} from './constants';
import { createGamePositions } from './gamePositions';
import { handlePowerUps, placeNewPowerUps } from './powerUps';

export function startGameInterval(
  game: GameType,
  gameStateUpdateHandler: () => void,
  scoreHandler: (player: PlayerType) => void,
  handlePlayersConnectivity: (now: number) => void,
  gameEndHandler: () => void,
) {
  game.game.ball.nextBounceVelocity = {
    x: generateRandom(BALL_VELOCITY_X, BALL_VELOCITY_X_MAX),
    y: generateRandom(-BALL_VELOCITY_Y, BALL_VELOCITY_Y),
  };

  setTimeout(() => {
    throwBall(game);
  }, THROW_BALL_TIMEMOUT);

  game.intervalId = setInterval(() => {
    if (game.isPaused) return;

    if (checkIsWinner(game)) {
      gameEndHandler();
      clearInterval(game.intervalId);
      return;
    }

    gameStateUpdateHandler();

    const playerThatScored = checkIfPlayerScored(game);
    updateNextFrameGameState(game);

    if (playerThatScored) {
      resetBall(game.game.ball);
      setTimeout(() => {
        throwBall(game);
      }, THROW_BALL_TIMEMOUT);
      scoreHandler(playerThatScored);
    }

    if (game.hasPowerUps) {
      placeNewPowerUps(game.game);
    }
    const now = Date.now();
    game.nextUpdateTime = now + INTERVAL_MS;
    handlePlayersConnectivity(now);
  }, INTERVAL_MS);
}

function resetBall(ball: BallType) {
  ball.vX = 0;
  ball.vY = 0;
  ball.aY = 0;
  ball.x = CANVAS_W / 2 - BALL_SIZE / 2;
  ball.y = CANVAS_H / 2 - BALL_SIZE / 2;
}

function throwBall(gameState: GameType) {
  const pointsSum =
    gameState.game.playerOne.score + gameState.game.playerTwo.score;
  const leftOrRight = (pointsSum % 2) * -2 + 1;
  const upOrDown = Math.round(Math.random()) * 2 - 1;

  gameState.game.ball.vX = leftOrRight * BALL_VELOCITY_X_FIRST_THROW;
  gameState.game.ball.vY = upOrDown * BALL_VELOCITY_Y_FIRST_THROW;
}

function checkIsWinner(game: GameType) {
  // return game.game.playerOne.score === 2 || game.game.playerTwo.score === 2;
  return (
    game.game.playerOne.score === game.points ||
    game.game.playerTwo.score === game.points
  );
}

function checkIfPlayerScored(game: GameType) {
  const { ball, playerTwo, playerOne } = game.game;

  if (ball.x + ball.w <= 0) {
    return playerTwo;
  } else if (ball.x >= CANVAS_W) {
    return playerOne;
  }
}

function updateNextFrameGameState(game: GameType) {
  if (game.hasPowerUps) {
    handlePowerUps(game.game);
  }

  const hitType = bounceBallAndMovePaddles(game.game, INTERVAL_S);

  if (hitType === BALL_HIT_TYPE.PADDLE) {
    handleBallAcceleration(game.game);
    game.game.ball.nextBounceVelocity = {
      x: generateRandom(BALL_VELOCITY_X, BALL_VELOCITY_X_MAX),
      y: generateRandom(-BALL_VELOCITY_Y, BALL_VELOCITY_Y),
    };
  }
}

const handleBallAcceleration = (game: GameStateType) => {
  const { ball, playerOne, playerTwo } = game;
  const paddle = ball.vX > 0 ? playerOne : playerTwo;

  const paddleMadeTheBallSpin =
    paddle.powerUp?.isCollected &&
    paddle.powerUp?.type === POWER_UPS.GRAVITY_PADDLE;

  ball.aY = paddleMadeTheBallSpin ? BALL_ACCELERATION : 0;
};

export const generateRandom = (min: number, max: number) => {
  const delta = max - min;
  return Math.random() * delta + min;
};

export function initialize(game: Selectable<Game>): GameType {
  const now = Date.now();
  return {
    startTime: now,
    isPaused: true,
    gameId: game.id,
    roomId: game.id.toString(),
    points: game.points,
    hasPowerUps: game.powerUps,
    isPublic: game.isPublic,
    intervalId: undefined,
    disconnectionIntervalId: undefined,
    nextUpdateTime: now + INTERVAL_MS,
    game: createGamePositions({
      playerOneId: game.playerOneId,
      playerTwoId: game.playerTwoId,
    }),
  };
}

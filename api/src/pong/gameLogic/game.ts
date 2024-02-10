import { Selectable } from 'kysely';
import {
  GameType,
  ObjectType,
  PLAYER_SIDES,
  POWER_UPS,
  PlayerType,
  GameStateType,
} from '../../types/games/pongGameTypes';
import { bottom, isToTheLeft, isToTheRight, rightSide } from './collisions';
import { Game } from 'src/types/schema';
import { BALL_SIZE, CANVAS_H, CANVAS_W, PADDLE_H, PADDLE_VELOCITY_Y, createGamePositions } from './gamePositions';

export const BALL_VELOCITY_X = 30;
export const BALL_VELOCITY_Y = 29;
export const BALL_VELOCITY_X_FIRST_THROW = 30;
export const BALL_VELOCITY_Y_FIRST_THROW = 29;
export const PADDLE_VELOCITY_POWER_UP = 50;
export const FPP = 15;
export const POWER_UP_TIMEOUT = 4000;
export const DISCONNECTION_PAUSE_TIMEOUT = 1000;
export const LIVE_STATS_INTERVAL = 5000;
export const DISCONNECTION_END_GAME_TIMEMOUT = 5;
export const THROW_BALL_TIMEMOUT = 1000;

export async function startGameInterval(
  game: GameType,
  gameEndHandler: (isGameEnd: boolean) => void,
  scoreHandler: (player: PlayerType) => void,
) {
  // if (game.hasPowerUps) {
  //   placeNewPowerUp(game);
  // }
  setTimeout(() => {
    throwBall(game);
  }, THROW_BALL_TIMEMOUT);

  game.intervalId = setInterval(async () => {
    if (game.isPaused) return;

    const isEnd = checkIsWinner(game);
    if (isEnd) {
      clearInterval(game.intervalId);
    }

    gameEndHandler(isEnd);

    const playerThatScored = checkIfPlayerScored(game);

    updateNextFrameGameState(game);
    if (playerThatScored) {
      scoreHandler(playerThatScored);
      resetGamePositions(game);
      setTimeout(() => {
        throwBall(game);
      }, THROW_BALL_TIMEMOUT);
    }
  }, 1000 / FPP);
}

function placeNewPowerUp(gameSate: GameType) {
  const randomPowerUp = (Math.floor(Math.random() * 3) + 1) as any;
  gameSate.game.powerUp = {
    h: 40,
    w: 40,
    vX: 0,
    vY: 0,
    x: CANVAS_W / 4 + (Math.random() * CANVAS_W) / 2,
    y: CANVAS_H / 4 + (Math.random() * CANVAS_H) / 2,
    type: randomPowerUp,
  };
}

function resetGamePositions(game: GameType) {
  game.game.ball = {
    ...game.game.ball,
    vX: 0,
    vY: 0,
    x: CANVAS_W / 2 - BALL_SIZE / 2,
    y: CANVAS_H / 2 - BALL_SIZE / 2,
  };
}

function throwBall(gameState: GameType) {
  const pointsSum =
    gameState.game.playerOne.score + gameState.game.playerTwo.score;
  const side = (pointsSum % 2) * -2 + 1;
  const ballVelocityX = side * BALL_VELOCITY_X_FIRST_THROW;
  const ballVelocityY =
    (Math.round(Math.random()) * 2 - 1) * BALL_VELOCITY_Y_FIRST_THROW;

  gameState.game.ball.vX = ballVelocityX;
  gameState.game.ball.vY = ballVelocityY;
  gameState.lastPlayerToHitTheBall = 0;
}

function checkIsWinner(game: GameType) {
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
  movePaddle(game.game.playerOne);
  movePaddle(game.game.playerTwo);
  moveObject(game.game.ball);
  bounceBall(game);
  // if (checkPowerUpCollision(game)) {
  //   handleHitPowerUp(game);
  // }
}

function checkPowerUpCollision(gameState: GameType) {
  if (!gameState.lastPlayerToHitTheBall || !gameState.game.powerUp) return;

  const { ball, powerUp } = gameState.game;
  if (ball.x + ball.w < powerUp.x || ball.x > powerUp.x + powerUp.w) {
    return false;
  }
  if (ball.y + ball.h < powerUp.y || ball.y > powerUp.y + powerUp.h) {
    return false;
  }
  return true;
}

function handleHitPowerUp(gameState: GameType) {
  const { playerOne, playerTwo } = gameState.game;

  let playerThatHit = playerOne;
  if (gameState.lastPlayerToHitTheBall === PLAYER_SIDES.RIGHT) {
    playerThatHit = playerTwo;
  }
  enablePowerUp(gameState.game, playerThatHit);
  gameState.game.powerUp = undefined;
  setTimeout(() => {
    placeNewPowerUp(gameState);
    disablePowerUp(gameState.game, playerThatHit);
  }, POWER_UP_TIMEOUT);
}

function enablePowerUp(game: GameStateType, player: PlayerType) {
  player.powerUp = game.powerUp?.type;
  if (player.powerUp === POWER_UPS.BIGGER_PADDLE) {
    player.h = 200;
    player.y -= 50;
  } else if (player.powerUp === POWER_UPS.SPEED) {
    player.vY = PADDLE_VELOCITY_POWER_UP;
  }
}

function disablePowerUp(game: GameStateType, player: PlayerType) {
  if (player.powerUp === POWER_UPS.BIGGER_PADDLE) {
    player.h = PADDLE_H;
    player.y += 50;
  } else if (player.powerUp === POWER_UPS.SPEED) {
    player.vY = PADDLE_VELOCITY_Y;
  }
  player.powerUp = undefined;
}

function moveObject(object: ObjectType) {
  object.x += object.vX;
  object.y += object.vY;
}

function movePaddle(paddle: ObjectType) {
  if (paddle.y + paddle.vY <= 0) {
    paddle.y -= paddle.y;
  } else if (paddle.y + paddle.h + paddle.vY >= CANVAS_H) {
    paddle.y += CANVAS_H - (paddle.y + paddle.h);
  } else {
    paddle.y += paddle.vY;
  }
}

function bounceBall(game: GameType) {
  bounceBallVertically(game);
  bounceBallPaddle(game);
}

function bounceBallVertically(game: GameType) {
  const { ball } = game.game;

  if (ball.y <= 0) {
    const ballOneFrameAgo = getPosOneFrameAgo(ball);
    const time = ballOneFrameAgo.y / ball.vY;
    ball.y = 0;
    ball.x = ballOneFrameAgo.x + ball.vX * time * -1;
    ball.vY *= -1;
  } else if (ball.y + ball.h >= CANVAS_H) {
    const ballOneFrameAgo = getPosOneFrameAgo(ball);
    const time = (CANVAS_H - (ballOneFrameAgo.y + ball.h)) / ball.vY;
    ball.y = CANVAS_H - ball.h;
    ball.x = ballOneFrameAgo.x + ball.vX * time;
    ball.vY *= -1;
  }
}

function bounceBallPaddle(game: GameType) {
  const { ball } = game.game;

  if (ball.vX < 0) {
    bounceBallLeftPaddle(game);
  } else if (ball.vX > 0) {
    bounceBallRightPaddle(game);
  }
}

function bounceBallLeftPaddle(game: GameType) {
  const { ball, playerOne } = game.game;
  const ballOneFrameAgo = getPosOneFrameAgo(ball);

  if (isToTheRight(ball, playerOne) || isToTheLeft(ballOneFrameAgo, playerOne))
    return;

  if (isToTheRight(ballOneFrameAgo, playerOne)) {
    const time = (ballOneFrameAgo.x - (playerOne.x + playerOne.w)) / ball.vX;
    const intersect = ballOneFrameAgo.y + ball.vY * time * -1;
    if (intersect > bottom(playerOne) || intersect < playerOne.y - ball.h) {
      return;
    }
    ball.x = playerOne.x + playerOne.w;
    ball.y = intersect;
    ball.vX *= -1;
    return;
  }
  // bounceBallOfPaddleVertically(ball, ballOneFrameAgo, playerOne);
}

function bounceBallRightPaddle(game: GameType) {
  const { ball, playerTwo } = game.game;
  const ballOneFrameAgo = getPosOneFrameAgo(ball);

  if (isToTheLeft(ball, playerTwo) || isToTheRight(ballOneFrameAgo, playerTwo))
    return;

  if (isToTheLeft(ballOneFrameAgo, playerTwo)) {
    const time = (playerTwo.x - (ballOneFrameAgo.x + ball.w)) / ball.vX;
    const intersect = ballOneFrameAgo.y + ball.vY * time;
    if (intersect > bottom(playerTwo) || intersect < playerTwo.y - ball.h) {
      return;
    }
    ball.x = playerTwo.x - ball.w;
    ball.y = intersect;
    ball.vX *= -1;
    return;
  }
  // bounceBallOfPaddleVertically(ball, ballOneFrameAgo, playerTwo);
}

function bounceBallOfPaddleVertically(
  ball: ObjectType,
  ballOneFrameAgo: ObjectType,
  paddle: ObjectType,
) {
  if (ball.vY < 0 && ball.y <= bottom(paddle)) {
    const time = (bottom(paddle) - ballOneFrameAgo.y) / ball.vY;
    const intersect = ballOneFrameAgo.x + ball.vX * time;
    if (intersect > rightSide(paddle) + ball.w || intersect < paddle.x - ball.w)
      return;

    ball.vY *= -1;
    ball.x = intersect;
    ball.y = bottom(paddle);
    return;
  }
  if (ball.vY > 0 && ball.y + ball.h >= paddle.y) {
    const time = (ballOneFrameAgo.y + ball.h - paddle.y) / ball.vY;
    const intersect = ballOneFrameAgo.x + ball.vX * time;
    if (intersect > rightSide(paddle) + ball.w || intersect < paddle.x - ball.w)
      return;

    ball.vY *= -1;
    ball.x = intersect;
    ball.y = paddle.y - ball.h;
    return;
  }
}

function getPosOneFrameAgo(obj: ObjectType): ObjectType {
  return {
    ...obj,
    x: obj.x - obj.vX,
    y: obj.y - obj.vY,
  };
}

export function movePlayerPaddle(
  player: PlayerType,
  move: 'up' | 'down' | 'stop',
) {
  if (move === 'up') {
    player.vY = -player.speed;
  } else if (move === 'down') {
    player.vY = player.speed;
  } else {
    // movePaddle(player);
    player.vY = 0;
  }
}

export function initialize(game: Selectable<Game>): GameType {
  return {
    isPaused: false,
    gameId: game.id,
    roomId: game.id.toString(),
    points: game.points,
    hasPowerUps: game.powerUps,
    isPublic: game.isPublic,
    intervalId: undefined,
    disconnectionIntervalId: undefined,
    lastPlayerToHitTheBall: 0,
    game: createGamePositions({
      playerOneId: game.playerOneId,
      playerTwoId: game.playerTwoId,
    }),
  };
}

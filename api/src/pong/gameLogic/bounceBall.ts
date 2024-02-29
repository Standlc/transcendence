import {
  BallType,
  GameStateType,
  ObjectType,
  PlayerType,
} from 'src/types/gameServer/pongGameTypes';
import { CANVAS_H } from './constants';
import { boundingBoxIntersection } from './collisions';
import { movePaddle } from './paddle';

export const BALL_HIT_TYPE = {
  WALL: 1,
  PADDLE: 2,
};

export function bounceBallAndMovePaddles(
  game: GameStateType,
  interval: number,
): number {
  const { ball } = game;
  if (interval <= 0 || (!ball.vX && !ball.vY)) {
    moveWorld(game, interval);
    return 0;
  }

  const timeToPaddle = getTimeToClosestPaddle(game);
  const timeToWall = getTimeToClosestWall(ball);

  const shortestTimeToCollision = Math.min(timeToPaddle, timeToWall);
  if (shortestTimeToCollision > interval) {
    moveWorld(game, interval);
    return 0;
  }

  if (timeToPaddle < timeToWall) {
    const hit = checkBallPaddleCollision(game, timeToPaddle);
    moveWorld(game, timeToPaddle);
    if (hit) changeBallVelocity(ball);
    bounceBallAndMovePaddles(game, interval - timeToPaddle);
    return hit ? BALL_HIT_TYPE.PADDLE : 0;
  }

  moveWorld(game, timeToWall);
  ball.vY *= -1;
  bounceBallAndMovePaddles(game, interval - timeToWall);
  return BALL_HIT_TYPE.WALL;
}

export const moveWorld = (game: GameStateType, time: number) => {
  move(game.ball, time);
  game.ball.vY += game.ball.aY * time;
  movePaddle(game.playerOne, time);
  movePaddle(game.playerTwo, time);
};

const getTimeToClosestPaddle = (game: GameStateType) => {
  const { ball, playerOne, playerTwo } = game;

  let timeToPaddle = Infinity;
  if (ball.vX > 0) {
    timeToPaddle = (playerTwo.x - (ball.x + ball.w)) / ball.vX;
  } else if (ball.vX < 0) {
    timeToPaddle = (ball.x - (playerOne.x + playerOne.w)) / -ball.vX;
  }
  return timeToPaddle > 0 ? timeToPaddle : Infinity;
};

const getTimeToClosestWall = (ball: BallType) => {
  if (ball.vY > 0) {
    return (CANVAS_H - (ball.y + ball.h)) / ball.vY;
  } else if (ball.vY < 0) {
    return ball.y / -ball.vY;
  }
  return Infinity;
};

const changeBallVelocity = (ball: BallType) => {
  ball.vX =
    ball.vX > 0 ? -ball.nextBounceVelocity.x : ball.nextBounceVelocity.x;
  ball.vY = ball.nextBounceVelocity.y;
};

function checkBallPaddleCollision(game: GameStateType, time: number) {
  const { ball, playerOne, playerTwo } = game;

  if (ball.vX < 0) {
    return checkBallSomePaddleCollision(ball, playerOne, time);
  } else if (ball.vX > 0) {
    return checkBallSomePaddleCollision(ball, playerTwo, time);
  }
  return false;
}

const checkBallSomePaddleCollision = (
  ball: BallType,
  paddle: PlayerType,
  time: number,
): boolean => {
  const ballAtCollision = moveObject(ball, time);
  const paddleAtCollision = moveObject(paddle, time);

  return boundingBoxIntersection(ballAtCollision, paddleAtCollision);
};

export const moveObject = (obj: ObjectType, time: number) => {
  const copy = { ...obj };
  copy.x = copy.vX * time + copy.x;
  copy.y = copy.vY * time + copy.y;
  return copy;
};

export const move = (obj: ObjectType, time: number) => {
  obj.x += obj.vX * time;
  obj.y += obj.vY * time;
};

// function bounceBallOfPaddleVertically(
//   ball: ObjectType,
//   ballOneFrameAgo: ObjectType,
//   paddle: ObjectType,
// ) {
//   if (ball.vY < 0 && ball.y <= bottom(paddle)) {
//     const time = (bottom(paddle) - ballOneFrameAgo.y) / ball.vY;
//     const intersect = ballOneFrameAgo.x + ball.vX * time;
//     if (intersect > rightSide(paddle) + ball.w || intersect < paddle.x - ball.w)
//       return;

//     ball.vY *= -1;
//     ball.x = intersect;
//     ball.y = bottom(paddle);
//     return;
//   }
//   if (ball.vY > 0 && ball.y + ball.h >= paddle.y) {
//     const time = (ballOneFrameAgo.y + ball.h - paddle.y) / ball.vY;
//     const intersect = ballOneFrameAgo.x + ball.vX * time;
//     if (intersect > rightSide(paddle) + ball.w || intersect < paddle.x - ball.w)
//       return;

//     ball.vY *= -1;
//     ball.x = intersect;
//     ball.y = paddle.y - ball.h;
//     return;
//   }
// }

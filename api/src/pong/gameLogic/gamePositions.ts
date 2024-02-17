import { GameStateType } from 'src/types/games/pongGameTypes';
import {
  BALL_SIZE,
  CANVAS_H,
  CANVAS_W,
  PADDLE_H,
  PADDLE_VELOCITY_Y,
  PADDLE_W,
  PADDLE_WALL_OFFSET,
} from './constants';

export function createGamePositions({
  playerOneId,
  playerTwoId,
}: {
  playerOneId?: number;
  playerTwoId?: number;
}): GameStateType {
  const now = Date.now();
  return {
    ball: {
      h: BALL_SIZE,
      w: BALL_SIZE,
      vX: 0,
      vY: 0,
      x: CANVAS_W / 2 - BALL_SIZE / 2,
      y: CANVAS_H / 2 - BALL_SIZE / 2,
      nextBounceVelocity: {
        x: 0,
        y: 0,
      },
      aY: 0,
    },
    playerOne: {
      w: PADDLE_W,
      h: PADDLE_H,
      vY: 0,
      vX: 0,
      x: PADDLE_WALL_OFFSET,
      y: CANVAS_H / 2 - PADDLE_H / 2,
      speed: PADDLE_VELOCITY_Y,
      id: playerOneId ?? 0,
      score: 0,
      isConnected: true,
      pingRtt: 0,
      lastPingTime: now,
    },
    playerTwo: {
      w: PADDLE_W,
      h: PADDLE_H,
      vY: 0,
      vX: 0,
      x: CANVAS_W - PADDLE_WALL_OFFSET - PADDLE_W,
      y: CANVAS_H / 2 - PADDLE_H / 2,
      speed: PADDLE_VELOCITY_Y,
      id: playerTwoId ?? 0,
      score: 0,
      isConnected: true,
      pingRtt: 0,
      lastPingTime: now,
    },
  };
}

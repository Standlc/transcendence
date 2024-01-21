import { CANVAS_H, CANVAS_W, ObjectType } from '../../types/game';
export const isTouchingWallsY = (ball: ObjectType) => {
  return ball.y <= 0 || ball.y + ball.h >= CANVAS_H;
};

export const isTouchingWallsX = (ball: ObjectType) => {
  return ball.x <= 0 || ball.x + ball.w >= CANVAS_W;
};

export const isTouchingLeftPaddle = (paddle: ObjectType, ball: ObjectType) => {
  if (ball.x > paddle.x + paddle.w) {
    return false;
  }
  // if (ball.y + ball.h < paddle.y) {
  //   return false;
  // }
  // if (ball.y > paddle.y + paddle.h) {
  //   return false;
  // }
  return true;
};

export const isTouchingRightPaddle = (paddle: ObjectType, ball: ObjectType) => {
  if (ball.x + ball.w < paddle.x) {
    return false;
  }
  if (ball.y + ball.h < paddle.y) {
    return false;
  }
  if (ball.y > paddle.y + paddle.h) {
    return false;
  }
  return true;
};

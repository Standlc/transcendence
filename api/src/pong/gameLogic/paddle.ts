import { ObjectType, PlayerType } from 'src/types/gameServer/pongGameTypes';
import { CANVAS_H } from './constants';

export function movePaddle(paddle: ObjectType, time: number) {
  if (!paddle.vY) return;

  paddle.y += paddle.vY * time;
  if (paddle.y <= 0) {
    paddle.y = 0;
    paddle.vY = 0;
  } else if (paddle.y + paddle.h >= CANVAS_H) {
    paddle.y = CANVAS_H - paddle.h;
    paddle.vY = 0;
  }
}

export const handlePlayerMove = (
  nextUpadteTime: number,
  player: PlayerType,
  move: 'up' | 'down' | 'stop',
  callBack: () => void,
) => {
  const now = Date.now();
  const deltaTime = (nextUpadteTime - now) / 1000;

  if (move === 'stop') {
    if (player.vY) {
      movePaddle(player, -deltaTime);
      player.vY = 0;
      callBack();
    }
  } else {
    if (player.vY) {
      movePaddle(player, -deltaTime);
      player.vY = 0;
    }
    player.vY = player.speed * (move === 'up' ? -1 : 1);
    callBack();
    movePaddle(player, deltaTime);
  }
};

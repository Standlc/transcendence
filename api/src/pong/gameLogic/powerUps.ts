import {
  GameStateType,
  POWER_UPS,
  PlayerType,
  PowerUpType,
} from 'src/types/gameServer/pongGameTypes';
import {
  CANVAS_H,
  FPP,
  INTERVAL_MS,
  INTERVAL_S,
  PADDLE_BIG_HEIGHT,
  PADDLE_H,
  PADDLE_VELOCITY_POWER_UP,
  PADDLE_VELOCITY_Y,
  POWER_UP_ACTIVE_TIME,
  POWER_UP_PROBABILITY_PER_SECOND,
  POWER_UP_SIZE,
} from './constants';
import { boundingBoxIntersection } from './collisions';
import { moveObject } from './bounceBall';

export function handlePowerUps(game: GameStateType) {
  handlePlayerPowerUp(game.playerOne);
  handlePlayerPowerUp(game.playerTwo);

  consumePowerUp(game.playerOne);
  consumePowerUp(game.playerTwo);
}

const consumePowerUp = (player: PlayerType) => {
  if (!player.powerUp || !player.powerUp.isCollected) return;
  player.powerUp.activeTimeLeft -= INTERVAL_MS;
  if (player.powerUp.activeTimeLeft <= 0) {
    disablePowerUp(player, player.powerUp);
    player.powerUp = undefined;
  }
};

const handlePlayerPowerUp = (player: PlayerType) => {
  const { powerUp } = player;
  if (!powerUp || powerUp.isCollected) return;
  let isIntersecting = boundingBoxIntersection(powerUp, player);

  if (!isIntersecting) {
    let distanceToPowerUp = -1;
    if (player.vY < 0) {
      distanceToPowerUp = player.y - powerUp.y + powerUp.h;
    } else if (player.vY > 0) {
      distanceToPowerUp = powerUp.y - (player.y + player.h);
    }
    if (distanceToPowerUp < 0) return;

    const timeToPowerUp = Math.abs(distanceToPowerUp / player.vY);
    if (timeToPowerUp > INTERVAL_S) return;

    isIntersecting = boundingBoxIntersection(
      powerUp,
      moveObject(player, timeToPowerUp),
    );
  }

  if (isIntersecting) {
    powerUp.isCollected = true;
    enablePowerUp(player, powerUp);
  }
};

const generatePlayerPowerUp = (player: PlayerType) => {
  if (player.powerUp) return;

  const generateNew = Math.random() < POWER_UP_PROBABILITY_PER_SECOND / FPP;
  if (!generateNew) return;

  let positionY = Math.random() * (CANVAS_H - POWER_UP_SIZE);
  while (
    positionY + POWER_UP_SIZE >= player.y &&
    positionY <= player.y + player.h
  ) {
    positionY = Math.random() * (CANVAS_H - POWER_UP_SIZE);
  }

  const types: (1 | 2 | 3)[] = [1, 2, 3];
  player.powerUp = {
    x: player.x - (POWER_UP_SIZE - player.w) / 2,
    y: positionY,
    h: POWER_UP_SIZE,
    w: POWER_UP_SIZE,
    vX: 0,
    vY: 0,
    isCollected: false,
    type: types[Math.floor(Math.random() * 3)],
    activeTimeLeft: POWER_UP_ACTIVE_TIME,
  };
};

function enablePowerUp(player: PlayerType, powerUp: PowerUpType) {
  if (powerUp.type === POWER_UPS.BIGGER_PADDLE) {
    player.h = PADDLE_BIG_HEIGHT;
    player.y -= (PADDLE_BIG_HEIGHT - PADDLE_H) / 2;
  } else if (powerUp.type === POWER_UPS.SPEED) {
    player.speed = PADDLE_VELOCITY_POWER_UP;
    if (player.vY) {
      player.vY = player.speed * (player.vY > 0 ? 1 : -1);
    }
  } else {
  }
}

function disablePowerUp(player: PlayerType, powerUp: PowerUpType) {
  if (powerUp.type === POWER_UPS.BIGGER_PADDLE) {
    player.h = PADDLE_H;
    player.y += (PADDLE_BIG_HEIGHT - PADDLE_H) / 2;
  } else if (powerUp.type === POWER_UPS.SPEED) {
    player.speed = PADDLE_VELOCITY_Y;
    if (player.vY) {
      player.vY = player.speed * (player.vY > 0 ? 1 : -1);
    }
  } else {
  }
}

export function placeNewPowerUps(game: GameStateType) {
  generatePlayerPowerUp(game.playerOne);
  generatePlayerPowerUp(game.playerTwo);
}

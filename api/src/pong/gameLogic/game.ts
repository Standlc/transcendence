import {
  BALL_SIZE,
  BALL_VELOCITY_X,
  BALL_VELOCITY_X_FIRST_THROW,
  BALL_VELOCITY_Y_FIRST_THROW,
  CANVAS_H,
  CANVAS_W,
  GAME_POINTS,
  PADDLE_H,
  PADDLE_VELOCITY_Y,
  PADDLE_W,
  GameType,
  ObjectType,
  PLAYER_SIDES,
  POWER_UPS,
  PlayerType,
  POWER_UP_TIMEOUT,
  THROW_BALL_TIMEMOUT,
  FPP,
  GameStateType,
  BALL_VELOCITY_Y,
} from '../../types/game';
import { isTouchingLeftPaddle, isTouchingRightPaddle } from './collisions';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameEngineService {
  async startGameInterval(
    game: GameType,
    callBack: (isGameEnd: boolean) => void,
  ) {
    setTimeout(() => this.throwBall(game), THROW_BALL_TIMEMOUT);
    if (game.hasPowerUps) {
      this.placeNewPowerUp(game);
    }

    game.intervalId = setInterval(async () => {
      if (game.isPaused) return;

      const somePlayerScored = this.checkBallIsOutAndChangeScore(game);
      if (somePlayerScored) {
        this.resetGamePositions(game);
        setTimeout(() => this.throwBall(game), THROW_BALL_TIMEMOUT);
      } else {
        this.updateNextFrameGameState(game);
      }

      const isEnd = this.checkIsWinner(game);
      if (isEnd) {
        clearInterval(game.intervalId);
      }
      callBack(isEnd);
    }, 1000 / FPP);
  }

  placeNewPowerUp(gameSate: GameType) {
    const randomPowerUp = (Math.floor(Math.random() * 3) + 1) as any;
    console.log(randomPowerUp);
    gameSate.game.powerUps = {
      h: 40,
      w: 40,
      vX: 0,
      vY: 0,
      x: CANVAS_W / 4 + (Math.random() * CANVAS_W) / 2,
      y: CANVAS_H / 4 + (Math.random() * CANVAS_H) / 2,
      type: randomPowerUp,
    };
  }

  resetGamePositions = (game: GameType) => {
    game.game.ball = {
      ...game.game.ball,
      vX: 0,
      vY: 0,
      x: CANVAS_W / 2 - BALL_SIZE / 2,
      y: CANVAS_H / 2 - BALL_SIZE / 2,
    };
  };

  throwBall(gameState: GameType) {
    const pointsSum =
      gameState.game.playerLeft.score + gameState.game.playerRight.score;
    const side = (pointsSum % 2) * -2 + 1;
    const ballVelocityX = side * BALL_VELOCITY_X_FIRST_THROW;
    const ballVelocityY =
      (Math.round(Math.random()) * 2 - 1) * BALL_VELOCITY_Y_FIRST_THROW;

    gameState.game.ball.vX = ballVelocityX;
    gameState.game.ball.vY = ballVelocityY;
    gameState.lastPlayerToHitTheBall = 0;
  }

  checkIsWinner = (game: GameType) => {
    if (
      game.game.playerLeft.score === GAME_POINTS ||
      game.game.playerRight.score === GAME_POINTS
    ) {
      return true;
    }
    return false;
  };

  checkBallIsOutAndChangeScore = (game: GameType) => {
    if (game.game.ball.x + game.game.ball.w <= 0) {
      game.game.playerRight.score += 1;
      return true;
    } else if (game.game.ball.x >= CANVAS_W) {
      game.game.playerLeft.score += 1;
      return true;
    }
    return false;
  };

  updateNextFrameGameState = (game: GameType) => {
    this.movePaddle(game.game.playerLeft);
    this.movePaddle(game.game.playerRight);
    this.moveBall(game);
    this.bounceBall(game);
    if (this.checkPowerUpCollision(game)) {
      this.handleHitPowerUp(game);
    }
  };

  checkPowerUpCollision(gameState: GameType) {
    if (!gameState.lastPlayerToHitTheBall || !gameState.game.powerUps) return;

    const { ball, powerUps } = gameState.game;
    if (ball.x + ball.w < powerUps.x || ball.x > powerUps.x + powerUps.w) {
      return false;
    }
    if (ball.y + ball.h < powerUps.y || ball.y > powerUps.y + powerUps.h) {
      return false;
    }
    return true;
  }

  handleHitPowerUp(gameState: GameType) {
    const { playerLeft, playerRight } = gameState.game;

    let playerThatHit = playerLeft;
    if (gameState.lastPlayerToHitTheBall === PLAYER_SIDES.RIGHT) {
      playerThatHit = playerRight;
    }
    this.enablePowerUp(gameState.game, playerThatHit);
    gameState.game.powerUps = undefined;
    setTimeout(() => {
      this.placeNewPowerUp(gameState);
      this.disablePowerUp(gameState.game, playerThatHit);
    }, POWER_UP_TIMEOUT);
  }

  enablePowerUp(game: GameStateType, player: PlayerType) {
    player.powerUp = game.powerUps?.type;
    if (player.powerUp === POWER_UPS.BIGGER_PADDLE) {
      player.h = 200;
      player.y -= 50;
    }
  }

  disablePowerUp(game: GameStateType, player: PlayerType) {
    if (player.powerUp === POWER_UPS.BIGGER_PADDLE) {
      player.h = PADDLE_H;
      player.y += 50;
    }
    player.powerUp = undefined;
  }

  moveBall(gameState: GameType) {
    const { ball, playerLeft, playerRight } = gameState.game;
    if (ball.vX === 0 && ball.vY === 0) {
      return;
    }

    this.moveObject(ball);

    let playerWithPower = playerRight;
    if (ball.vX < 0) {
      if (
        !playerLeft.powerUp ||
        playerLeft.powerUp !== POWER_UPS.GRAVITY_PADDLE
      ) {
        return;
      }
      playerWithPower = playerLeft;
    } else if (
      !playerRight.powerUp ||
      playerRight.powerUp !== POWER_UPS.GRAVITY_PADDLE
    ) {
      return;
    }

    const ballCenterY = ball.y + ball.h / 2;
    const paddleCenterY = playerWithPower.y + playerWithPower.h / 2;
    const acc = {
      y: paddleCenterY - ballCenterY,
      x: playerWithPower.x - ball.x,
    };
    const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2);
    const preMagnitude = Math.sqrt(ball.vX ** 2 + ball.vY ** 2);
    acc.x = magnitude ? acc.x / magnitude : 0;
    acc.y = magnitude ? acc.y / magnitude : 0;
    ball.vY = (acc.y * preMagnitude + ball.vY * 20) / 21;
  }

  moveObject = (object: ObjectType) => {
    object.x += object.vX;
    object.y += object.vY;
  };

  movePaddle = (paddle: ObjectType) => {
    if (paddle.y + paddle.vY <= 0) {
      paddle.y -= paddle.y;
    } else if (paddle.y + paddle.h + paddle.vY >= CANVAS_H) {
      paddle.y += CANVAS_H - (paddle.y + paddle.h);
    } else {
      paddle.y += paddle.vY;
    }
  };

  bounceBall = (game: GameType) => {
    this.bounceBallHorizontally(game);
    this.bounceBallPaddle(game);
  };

  bounceBallHorizontally(game: GameType) {
    const { ball } = game.game;

    if (ball.y <= 0) {
      ball.y -= ball.y * 2;
      ball.vY *= -1;
    } else if (ball.y + ball.h >= CANVAS_H) {
      ball.y -= (ball.y + ball.h - CANVAS_H) * 2;
      ball.vY *= -1;
    }
  }

  bounceBallPaddle(game: GameType) {
    const { ball, playerLeft, playerRight } = game.game;

    if (isTouchingLeftPaddle(playerLeft, ball)) {
      const velocityFactor = Math.random() * 1 + 1;
      ball.x -= (ball.x - (playerLeft.x + playerLeft.w)) * 2;
      ball.vX = velocityFactor * BALL_VELOCITY_X;
      game.lastPlayerToHitTheBall = PLAYER_SIDES.LEFT;
    } else if (isTouchingRightPaddle(playerRight, ball)) {
      const velocityFactor = Math.random() * 1 + 1;
      ball.x -= (ball.x + ball.w - playerRight.x) * 2;
      ball.vX = velocityFactor * -BALL_VELOCITY_X;
      game.lastPlayerToHitTheBall = PLAYER_SIDES.RIGHT;
    }
  }

  movePlayerPaddle(player: PlayerType, move: 'up' | 'down' | 'stop') {
    if (move === 'up') {
      player.vY = -PADDLE_VELOCITY_Y;
    } else if (move === 'down') {
      player.vY = PADDLE_VELOCITY_Y;
    } else {
      player.vY = 0;
    }
  }

  initialize(props: {
    id: number;
    playerJoinedId: number;
    playerJoiningId: number;
    isPublic: boolean;
    hasPowerUps: boolean;
  }): GameType {
    return {
      hasPowerUps: props.hasPowerUps,
      isPublic: props.isPublic,
      roomId: props.id.toString(),
      intervalId: undefined,
      disconnectionIntervalId: undefined,
      lastPlayerToHitTheBall: 0,
      isPaused: false,
      game: GameEngineService.createGamePositions({
        id: props.id,
        playerJoinedId: props.playerJoinedId,
        playerJoiningId: props.playerJoiningId,
      }),
    };
  }

  static createGamePositions(props?: {
    id: number;
    playerJoinedId: number;
    playerJoiningId: number;
  }) {
    return {
      id: props?.id ?? 0,
      ball: {
        h: BALL_SIZE,
        w: BALL_SIZE,
        vX: 0,
        vY: 0,
        x: CANVAS_W / 2 - BALL_SIZE / 2,
        y: CANVAS_H / 2 - BALL_SIZE / 2,
      },
      playerLeft: {
        w: PADDLE_W,
        h: PADDLE_H,
        vY: 0,
        vX: 0,
        x: 20,
        y: CANVAS_H / 2 - PADDLE_H / 2,
        userId: props?.playerJoinedId ?? 0,
        score: 0,
        isConnected: true,
      },
      playerRight: {
        w: PADDLE_W,
        h: PADDLE_H,
        vY: 0,
        vX: 0,
        x: CANVAS_W - 20 - PADDLE_W,
        y: CANVAS_H / 2 - PADDLE_H / 2,
        userId: props?.playerJoiningId ?? 0,
        score: 0,
        isConnected: true,
      },
      w: CANVAS_W,
      h: CANVAS_H,
    };
  }
}

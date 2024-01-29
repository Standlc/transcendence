import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CRYSTAL, POWER_UP_COLORS } from "../utils/game/sprites";
import { UserContext } from "../contextsProviders/UserContext";
import { GameSocketContext } from "../contextsProviders/GameSocketContext";
import {
  GameStateType,
  ObjectType,
  PowerUpType,
} from "../../../api/src/types/games/pongGameTypes";
import { WsPlayerMove } from "../../../api/src/types/games/socketPayloadTypes";

const SERVER_FPP = 20;
const VELOCITY_RATIO = 1;

const MOVE_MAP: Record<string, "up" | "down"> = {
  ArrowUp: "up",
  ArrowDown: "down",
};

interface props {
  game: GameStateType;
  gameId?: number;
  isPaused: boolean;
}

const GameCanvas = memo(({ game, gameId, isPaused }: props) => {
  const socket = useContext(GameSocketContext);
  const { user } = useContext(UserContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currMove, setCurrMove] = useState<"stop" | "up" | "down">("stop");
  const isUserAPlayer = useMemo(
    () => game.playerOne.id === user.id || game.playerTwo.id === user.id,
    [user.id, game.playerOne.id, game.playerTwo.id]
  );

  const drawRect = (
    ctx: CanvasRenderingContext2D,
    obj: ObjectType,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  };

  const drawPowerUp = (ctx: CanvasRenderingContext2D, obj: PowerUpType) => {
    const pixelSize = obj.h / CRYSTAL.length;

    for (let y = 0; y < CRYSTAL.length; y++) {
      for (let x = 0; x < CRYSTAL[y].length; x++) {
        ctx.fillStyle = POWER_UP_COLORS[obj.type][CRYSTAL[y][x]];
        ctx.fillRect(
          obj.x + x * pixelSize,
          obj.y + y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  };

  const drawGame = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    game: GameStateType
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    drawMiddleSeparation(ctx, game);
    ctx.fillStyle = "white";
    // drawSprite(ctx, game.ball, BASKETBALL, BASKETBALL_COLORS);
    drawRect(ctx, game.ball, "white");
    drawRect(ctx, game.playerOne, "white");
    drawRect(ctx, game.playerTwo, "white");
    if (game.powerUp) {
      drawPowerUp(ctx, game.powerUp);
    }
  };

  const drawMiddleSeparation = (
    ctx: CanvasRenderingContext2D,
    game: GameStateType
  ) => {
    const posX = game.w / 2;

    ctx.translate(0, 10);
    ctx.beginPath();
    ctx.setLineDash([20, 20]);
    ctx.lineWidth = 10;
    ctx.moveTo(posX, 0);
    ctx.lineTo(posX, game.h);
    ctx.stroke();
    ctx.translate(0, -10);
  };

  const movePaddle = (paddle: ObjectType, deltaTime: number) => {
    const newPosY =
      paddle.y + paddle.vY * SERVER_FPP * deltaTime * VELOCITY_RATIO;

    if (newPosY <= 0) {
      paddle.y = 0;
    } else if (newPosY + paddle.h > 600) {
      paddle.y = 600 - paddle.h;
    } else {
      paddle.y = newPosY;
    }
  };

  const getPosOneFrameAgo = (
    obj: ObjectType,
    deltaTime: number
  ): ObjectType => {
    return {
      ...obj,
      x: obj.x - obj.vX * SERVER_FPP * deltaTime,
      y: obj.y - obj.vY * SERVER_FPP * deltaTime,
    };
  };

  const bounceBallVertically = (game: GameStateType, deltaTime: number) => {
    const { ball } = game;

    if (ball.y <= 0) {
      const ballOneFrameAgo = getPosOneFrameAgo(ball, deltaTime);
      const time = ballOneFrameAgo.y / ball.vY;
      ball.y = 0;
      ball.x = ballOneFrameAgo.x + ball.vX * time * -1;
      ball.vY *= -1;
      return true;
    } else if (ball.y + ball.h >= 600) {
      const ballOneFrameAgo = getPosOneFrameAgo(ball, deltaTime);
      const time = (600 - (ballOneFrameAgo.y + ball.h)) / ball.vY;
      ball.y = 600 - ball.h;
      ball.x = ballOneFrameAgo.x + ball.vX * time;
      console.log("ball.x", ball.x);
      ball.vY *= -1;
      return true;
    }
    return false;
  };

  const moveObject = (object: ObjectType, deltaTime: number) => {
    object.x += object.vX * SERVER_FPP * deltaTime * VELOCITY_RATIO;
    object.y += object.vY * SERVER_FPP * deltaTime * VELOCITY_RATIO;
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let prev = 0;

    const draw = () => {
      animationFrameId = requestAnimationFrame((now) => {
        const { ball, playerOne, playerTwo } = game;
        const deltaTime = prev ? (now - prev) / 1000 : 0;
        prev = now;
        moveObject(ball, deltaTime);
        movePaddle(playerOne, deltaTime);
        movePaddle(playerTwo, deltaTime);
        // bounceBallVertically(game, deltaTime);
        drawGame(canvas, ctx, game);
        if (!isPaused) {
          draw();
        }
      });
    };
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvasRef.current, socket, game, isPaused]);

  useEffect(() => {
    if (!isUserAPlayer || !gameId || isPaused) return;
    const payload: WsPlayerMove = { gameId, move: currMove };
    socket.emit("playerMove", payload);
  }, [currMove, socket, isUserAPlayer, gameId, isPaused]);

  useEffect(() => {
    if (!isUserAPlayer || !gameId || isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        setCurrMove(MOVE_MAP[e.key]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        (e.key === "ArrowUp" && currMove === "up") ||
        (e.key === "ArrowDown" && currMove === "down")
      ) {
        setCurrMove("stop");
      }
    };

    addEventListener("keydown", handleKeyDown);
    addEventListener("keyup", handleKeyUp);
    return () => {
      removeEventListener("keydown", handleKeyDown);
      removeEventListener("keyup", handleKeyUp);
    };
  }, [currMove, isUserAPlayer, isPaused]);

  return (
    <canvas
      ref={canvasRef}
      height={600}
      width={800}
      className="[image-rendering:pixelated] h-full w-full"
    />
  );
});

export default GameCanvas;
// const drawSprite = (
//   ctx: CanvasRenderingContext2D,
//   obj: ObjectType,
//   sprite: any,
//   colorTable: any
// ) => {
//   const pixelSize = obj.h / sprite.length;

//   for (let y = 0; y < sprite.length; y++) {
//     for (let x = 0; x < sprite[y].length; x++) {
//       ctx.fillStyle = colorTable[sprite[y][x]];
//       ctx.fillRect(
//         obj.x + x * pixelSize,
//         obj.y + y * pixelSize,
//         pixelSize,
//         pixelSize
//       );
//     }
//   }
// };

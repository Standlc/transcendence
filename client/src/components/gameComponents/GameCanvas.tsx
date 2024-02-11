import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UserContext } from "../../ContextsProviders/UserContext";
import { GameSocketContext } from "../../ContextsProviders/GameSocketContext";
import {
  GameStateType,
  ObjectType,
} from "../../../../api/src/types/games/pongGameTypes";
import { WsPlayerMove } from "../../../../api/src/types/games/socketPayloadTypes";
import {
  CANVAS_H,
  CANVAS_W,
} from "../../../../api/src/pong/gameLogic/gamePositions";
import { SoundEffects } from "./GameSoundEffects";
import { PowerUp } from "./PowerUp";

const SERVER_FPP = 15;
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

  const drawGame = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    game: GameStateType
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMiddleSeparation(ctx);
    ctx.fillStyle = "white";
    drawRect(ctx, game.ball, "white");
    drawRect(ctx, game.playerOne, "white");
    drawRect(ctx, game.playerTwo, "white");
  };

  const drawMiddleSeparation = (ctx: CanvasRenderingContext2D) => {
    const posX = CANVAS_W / 2;

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.translate(0, 17);
    ctx.beginPath();
    ctx.setLineDash([34, 34]);
    ctx.lineWidth = 8;
    ctx.moveTo(posX, 0);
    ctx.lineTo(posX, CANVAS_H);
    ctx.stroke();
    ctx.translate(0, -17);
  };

  const movePaddle = (paddle: ObjectType, deltaTime: number) => {
    const newPosY =
      paddle.y + paddle.vY * SERVER_FPP * deltaTime * VELOCITY_RATIO;

    if (newPosY <= 0) {
      paddle.y = 0;
    } else if (newPosY + paddle.h > CANVAS_H) {
      paddle.y = CANVAS_H - paddle.h;
    } else {
      paddle.y = newPosY;
    }
  };

  function bounceBallVertically(ball: ObjectType) {
    if (ball.y <= 0) {
      ball.y = -ball.y * 2;
      ball.vY *= -1;
    } else if (ball.y + ball.h >= CANVAS_H) {
      ball.y -= (ball.y + ball.h - CANVAS_H) * 2;
      ball.vY *= -1;
    }
  }

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
        bounceBallVertically(game.ball);
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
    <>
      <canvas
        ref={canvasRef}
        height={CANVAS_H}
        width={CANVAS_W}
        className="[image-rendering:pixelated] h-full w-full"
      />
      <PowerUp powerUp={game.powerUp} />
      <SoundEffects ballVelocityX={game.ball.vX} ballVelocityY={game.ball.vY} />
    </>
  );
});

export default GameCanvas;

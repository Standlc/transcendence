import { useContext, useEffect, useRef, useState } from "react";
import {
  GameStateType,
  ObjectType,
  PowerUpType,
} from "../../../api/src/types/game";
import {
  BASKETBALL,
  BASKETBALL_COLORS,
  CRYSTAL,
  POWER_UP_COLORS,
} from "../utils/game/sprites";
import { UserContext } from "../ContextsProviders/UserContext";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import { useGamePlayers } from "../utils/game/useGetGamePlayers";

const MOVE_MAP: Record<string, "up" | "down"> = {
  ArrowUp: "up",
  ArrowDown: "down",
};

interface props {
  game: GameStateType;
}

export default function GameCanvas({ game }: props) {
  const socket = useContext(GameSocketContext);
  const { user } = useContext(UserContext);
  const { playerLeft, playerRight } = useGamePlayers(game);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currMove, setCurrMove] = useState<null | "up" | "down">(null);

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

  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    obj: ObjectType,
    sprite: any,
    colorTable: any
  ) => {
    const pixelSize = obj.h / sprite.length;

    for (let y = 0; y < sprite.length; y++) {
      for (let x = 0; x < sprite[y].length; x++) {
        ctx.fillStyle = colorTable[sprite[y][x]];
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
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    drawMiddleSeparation(ctx);

    ctx.fillStyle = "white";
    drawSprite(ctx, game.ball, BASKETBALL, BASKETBALL_COLORS);
    drawRect(ctx, game.playerLeft, "white");
    drawRect(ctx, game.playerRight, "white");
    if (game.powerUps) {
      drawPowerUp(ctx, game.powerUps);
    }
  };

  const drawMiddleSeparation = (ctx: CanvasRenderingContext2D) => {
    const posX = game.w / 2;

    ctx.translate(0, 10);
    ctx.beginPath();
    ctx.setLineDash([20, 20]);
    ctx.lineWidth = 5;
    ctx.moveTo(posX, 0);
    ctx.lineTo(posX, game.h);
    ctx.stroke();
    ctx.translate(0, -10);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animationFrameId = requestAnimationFrame(() => drawGame(canvas, ctx));
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvasRef.current, game]);

  const playerMovePayload = (move: "up" | "down" | "stop") => {
    return { userId: user.id, gameId: game.id, move };
  };

  /**
   * CONTROLS
   */
  useEffect(() => {
    if (playerLeft.userId !== user.id) {
      return;
    }

    socket.emit("playerMove", playerMovePayload(currMove ?? "stop"));
  }, [currMove, socket, user, game]);

  useEffect(() => {
    if (playerLeft.userId !== user.id) {
      return;
    }

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
        setCurrMove(null);
      }
    };

    addEventListener("keydown", handleKeyDown);
    addEventListener("keyup", handleKeyUp);
    return () => {
      removeEventListener("keydown", handleKeyDown);
      removeEventListener("keyup", handleKeyUp);
    };
  }, [currMove, playerLeft.userId]);

  return (
    <canvas
      ref={canvasRef}
      height={game.h}
      width={game.w}
      className="[image-rendering:pixelated] h-full w-full"
    />
  );
}

// const drawDottedLine = (
//   ctx: CanvasRenderingContext2D,
//   og: VecType,
//   to: VecType
// ) => {
//   ctx.beginPath();
//   ctx.setLineDash([5, 10]);
//   ctx.lineWidth = 10;
//   ctx.moveTo(og.x, og.y);
//   ctx.lineTo(to.x, to.y);
//   ctx.stroke();
// };

// const drawCanvasOutline = (ctx: CanvasRenderingContext2D) => {
//   drawDottedLine(ctx, { x: 0, y: 0 }, { x: game.w, y: 0 });
//   drawDottedLine(ctx, { x: 0, y: game.h }, { x: game.w, y: game.h });
// };

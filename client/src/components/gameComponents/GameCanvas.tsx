import {
  MutableRefObject,
  memo,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  BallType,
  GameStateType,
  ObjectType,
  PlayerType,
} from "../../../../api/src/types/games/pongGameTypes";
import {
  CANVAS_H,
  CANVAS_W,
} from "../../../../api/src/pong/gameLogic/constants";
import {
  BALL_HIT_TYPE,
  bounceBallAndMovePaddles,
} from "../../../../api/src/pong/gameLogic/bounceBall";
import { useSoundEffects } from "../../utils/game/useSoundEffects";
import { POWER_UPS_EMOJIS } from "../../utils/game/sprites";
import { BALL_STYLES_IMAGES } from "../../utils/game/ballStyles";
import { GameSettingsContext } from "../../ContextsProviders/GameSettingsContext";
import { boundingBoxIntersection } from "../../../../api/src/pong/gameLogic/collisions";

interface props {
  gameRef: MutableRefObject<GameStateType>;
  isPaused: boolean;
}

const GameCanvas = memo(({ gameRef, isPaused }: props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameSettings } = useContext(GameSettingsContext);
  const [ballImg, setBallImg] = useState<HTMLImageElement | null>(null);
  const soundEffects = useSoundEffects();
  const ballRotation = useRef(0);
  const playerOnePowerUpFrame = useRef(0);
  const playerTwoPowerUpFrame = useRef(0);
  const somePlayerScored = useRef(false);

  useLayoutEffect(() => {
    if (gameSettings.ballStyle !== "Classic") {
      const img = new Image();
      img.onload = () => {
        setBallImg(img);
      };
      const imgUrl = BALL_STYLES_IMAGES[gameSettings.ballStyle];
      if (imgUrl) {
        img.src = imgUrl;
      }
    } else {
      setBallImg(null);
    }
  }, [gameSettings.ballStyle]);

  const drawRect = (
    ctx: CanvasRenderingContext2D,
    obj: ObjectType,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  };

  const drawPowerUp = (
    ctx: CanvasRenderingContext2D,
    player: PlayerType,
    frameRef: MutableRefObject<number>
  ) => {
    if (player.powerUp && !player.powerUp.isCollected) {
      const { powerUp } = player;
      ctx.font = `${powerUp.h}px Arial`;
      const index = Math.floor(frameRef.current / 10);
      ctx.fillText(POWER_UPS_EMOJIS[index], powerUp.x, powerUp.y + powerUp.h);
      frameRef.current++;
      if (Math.floor(frameRef.current / 10) >= POWER_UPS_EMOJIS.length) {
        frameRef.current = 0;
      }
    }
  };

  const drawBall = (ctx: CanvasRenderingContext2D, ball: BallType) => {
    ctx.fillStyle = "white";
    ctx.translate(ball.x + ball.w / 2, ball.y + ball.h / 2);
    ctx.rotate((ballRotation.current * Math.PI) / 180);
    if (ballImg) {
      const factor = 0.85;
      ctx.drawImage(
        ballImg,
        -ball.w / (2 * factor),
        -ball.h / (2 * factor),
        ball.w / factor,
        ball.h / factor
      );
    } else {
      ctx.fillRect(-ball.w / 2, -ball.h / 2, ball.w, ball.h);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (ball.aY) {
      ballRotation.current += 30;
    } else {
      ballRotation.current = 0;
    }
  };

  const drawGame = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    game: GameStateType
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPowerUp(ctx, game.playerOne, playerOnePowerUpFrame);
    drawPowerUp(ctx, game.playerTwo, playerTwoPowerUpFrame);
    drawBall(ctx, game.ball);
    drawRect(ctx, game.playerOne, "white");
    drawRect(ctx, game.playerTwo, "white");
  };

  const handlePowerUpSound = (player: PlayerType) => {
    if (!player.powerUp || player.powerUp.isCollected) return;

    if (boundingBoxIntersection(player, player.powerUp)) {
      soundEffects.powerUp();
      player.powerUp.isCollected = true;
    }
  };

  const handleSoundEffects = (game: GameStateType, bounceType: number) => {
    const { ball, playerOne, playerTwo } = game;

    if (ball.x <= 0 || ball.x + ball.w >= CANVAS_W) {
      if (!somePlayerScored.current) soundEffects.score();
      somePlayerScored.current = true;
    } else {
      somePlayerScored.current = false;
      if (bounceType === BALL_HIT_TYPE.WALL) {
        soundEffects.wallHit();
      } else if (bounceType === BALL_HIT_TYPE.PADDLE) {
        soundEffects.paddleHit();
      }
    }
    handlePowerUpSound(playerOne);
    handlePowerUpSound(playerTwo);
  };

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let prev = 0;

    const draw = () => {
      animationFrameId = requestAnimationFrame((now) => {
        if (!gameRef.current) return;
        const deltaTime = prev ? (now - prev) / 1000 : 0;
        prev = now;

        drawGame(canvas, ctx, gameRef.current);
        const bounceType = bounceBallAndMovePaddles(gameRef.current, deltaTime);
        if (gameSettings.soundEffects) {
          handleSoundEffects(gameRef.current, bounceType);
        }
        if (!isPaused) draw();
      });
    };
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, gameSettings.soundEffects, soundEffects, ballImg]);

  return (
    <canvas
      ref={canvasRef}
      height={CANVAS_H}
      width={CANVAS_W}
      className="[image-rendering:pixelated] h-full w-full"
    />
  );
});

export default GameCanvas;

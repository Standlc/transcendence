import { memo, useEffect, useMemo, useState } from "react";

const useSound = (url: string) => {
  const sound = useMemo(() => new Audio(url), []);
  return sound;
};

export const SoundEffects = memo(
  ({
    ballVelocityX,
    ballVelocityY,
  }: {
    ballVelocityX: number;
    ballVelocityY: number;
  }) => {
    const [ballVelocity, setBallVelocity] = useState({
      x: ballVelocityX,
      y: ballVelocityY,
    });
    const wallHitSound1 = useSound("/pong_wall_hit_sound.mp3");
    // const wallHitSound2 = useSound("/pong_wall_hit_sound_2.mp3");
    const paddleHitSound = useSound("/pong_paddle_hit_sound.mp3");
    // const gameOverSound = useSound("/pong_game_over_sound.mp3");

    useEffect(() => {
      if (
        (ballVelocity.x || ballVelocity.y) &&
        (ballVelocityX || ballVelocityY)
      ) {
        if (ballVelocityX != ballVelocity.x) {
          console.log("paddle hit!");
          paddleHitSound.play();
        } else if (ballVelocityY != ballVelocity.y) {
          console.log("wall hit!");
          wallHitSound1.play();
        }
      }

      setBallVelocity({
        x: ballVelocityX,
        y: ballVelocityY,
      });
    }, [ballVelocityX, ballVelocityY]);

    return null;
  }
);

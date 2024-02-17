import { useMemo } from "react";

export const useSound = (url: string) => {
  const sound = useMemo(() => new Audio(url), []);
  return sound;
};

export const useSoundEffects = () => {
  const wallHitSound1 = useSound("/pong_wall_hit_sound.mp3");
  const paddleHitSound = useSound("/pong_paddle_hit_sound.mp3");
  const gameOverSound = useSound("/pong_game_over_sound2.mp3");
  const powerUpSound = useSound("/pong_powerup_sound.mp3");

  return {
    wallHit: () => wallHitSound1.play(),
    paddleHit: () => paddleHitSound.play(),
    score: () => gameOverSound.play(),
    powerUp: () => powerUpSound.play(),
  };
};

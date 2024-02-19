import { useMemo } from "react";

export const useSound = (url: string, volume: number) => {
  const sound = useMemo(() => new Audio(url), [url]);
  sound.volume = volume / 4;
  return sound;
};

export const useSoundEffects = (volume: number) => {
  const wallHitSound1 = useSound("/pong_wall_hit_sound.mp3", volume);
  const paddleHitSound = useSound("/pong_paddle_hit_sound.mp3", volume);
  const gameOverSound = useSound("/pong_game_over_sound2.mp3", volume);
  const powerUpSound = useSound("/pong_powerup_sound.mp3", volume);

  const sounds = useMemo(() => {
    return {
      wallHit: () => wallHitSound1.play(),
      paddleHit: () => paddleHitSound.play(),
      score: () => gameOverSound.play(),
      powerUp: () => powerUpSound.play(),
    };
  }, [wallHitSound1, paddleHitSound, gameOverSound, powerUpSound]);

  return sounds;
};

import { memo, useEffect, useRef, useState } from "react";
import { POWER_UPS_EMOJIS } from "../../utils/game/sprites";
import { ObjectType } from "../../../../api/src/types/games/pongGameTypes";

export const PowerUp = memo(
  ({ powerUp }: { powerUp: ObjectType | undefined }) => {
    const emojiIndex = useRef(0);
    const [emoji, setEmoji] = useState(POWER_UPS_EMOJIS[emojiIndex.current]);

    useEffect(() => {
      const intervalId = setInterval(() => {
        emojiIndex.current++;
        emojiIndex.current = emojiIndex.current % POWER_UPS_EMOJIS.length;
        setEmoji(POWER_UPS_EMOJIS[emojiIndex.current]);
      }, 1000 / 5);

      return () => clearInterval(intervalId);
    }, []);

    if (!powerUp) {
      return null;
    }

    return (
      <div
        style={{
          height: powerUp.h * 1.5,
          width: powerUp.w * 1.5,
          top: powerUp.y,
          left: powerUp.x,
        }}
        className="absolute text-3xl bg-white bg-opacity-20 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-fuchsia-500 to-rose-500"
      >
        {emoji}
      </div>
    );
  }
);

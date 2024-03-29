import { useContext, useLayoutEffect, useRef, useState } from "react";
import GameLayout from "../components/gameComponents/GameLayout";
import GamePreferences from "../components/gameSettings/GameSettings";
import LiveGames from "../components/playPage/LiveGames";
import Leaderboard from "../components/playPage/Leaderboard";
import GameCanvas from "../components/gameComponents/GameCanvas";
import { ArrowLink } from "../UIKit/ArrowLink";
import { createGamePositions } from "../../../api/src/pong/gameLogic/gamePositions";
import { PlayArrowRounded, SettingsRounded } from "@mui/icons-material";
import { PlayButton } from "../UIKit/PlayButton";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import { useFindGameMatch } from "../utils/useFindGameMatch";

export default function PlayPage() {
  const gameRef = useRef(createGamePositions({}));
  const [showSettings, setShowSettings] = useState(false);
  const { gameSettings } = useContext(GameSettingsContext);
  const findGame = useFindGameMatch({
    points: gameSettings.points,
    powerUps: gameSettings.powerUps,
  });

  useLayoutEffect(() => {
    gameRef.current.ball.vX = 200;
    gameRef.current.ball.nextBounceVelocity.x = 200;
    gameRef.current.ball.nextBounceVelocity.y = 0;
  }, []);

  return (
    <div className="flex flex-col gap-10 h-full w-full">
      <div className="flex gap-5 flex-wrap justify-center">
        <div className="flex-[4] relative flex justify-center">
          <GameLayout>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="absolute z-[2] animate-slow-spin top-3 right-3 p-1 flex before:absolute before:top-0 before:left-0 before:content-[''] before:h-[100%] before:w-[100%] before:rounded-full before:bg-white before:opacity-20"
            >
              <SettingsRounded />
            </button>

            <div className="absolute z-[2] flex flex-col gap-2">
              <PlayButton
                isDisabled={findGame.isPending}
                onClick={() => findGame.mutate()}
              >
                <PlayArrowRounded style={{ margin: "-7px", fontSize: 30 }} />
                <span className="pl-3">Play Online</span>
              </PlayButton>
            </div>

            <GameCanvas gameRef={gameRef} isPaused={false} />
          </GameLayout>
        </div>

        {showSettings && (
          <div className="bg-white bg-opacity-5 rounded-md shadow-md ">
            <GamePreferences hide={() => setShowSettings(false)} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <ArrowLink to={"/play/leaderboard"}>🥇 Leaderboard</ArrowLink>
        </div>
        <Leaderboard limit={3} />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex gap-3 items-center group">
          <div className="h-[10px] w-[10px] m-[7px] flex aspect-square rounded-full bg-green-600 before:content-[''] before:rounded-full before:h-full before:w-full before:animate-ping before:bg-green-600"></div>
          <ArrowLink to={"/play/live"}>Live Games</ArrowLink>
        </div>
        <LiveGames />
      </div>
    </div>
  );
}

import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import GameLayout from "../components/gameComponents/GameLayout";
import GamePreferences from "../components/GamePreferences";
import LiveGames from "../components/LiveGames";
import Leaderboard from "../components/Leaderboard";
import GameCanvas from "../components/gameComponents/GameCanvas";
import { ArrowLink } from "../UIKit/ArrowLink";
import { createGamePositions } from "../../../api/src/pong/gameLogic/gamePositions";
import { PlayArrowRounded, SettingsRounded } from "@mui/icons-material";
import { useFindGameMatch } from "../utils/requests/useFindGameMatch";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";

export default function PlayPage() {
  const socket = useContext(GameSocketContext);
  const [privateInvitation, setPrivateInvitation] = useState<{
    userId: number;
  }>();
  const gameRef = useRef(createGamePositions({}));
  const [showSettings, setShowSettings] = useState(false);
  const [privateGameUserId, setPrivateGameUserId] = useState<string>("");
  const { gameSettings } = useContext(GameSettingsContext);
  const { findGame, isFindingGame } = useFindGameMatch({
    points: gameSettings.points,
    powerUps: gameSettings.powerUps,
  });

  useEffect(() => {
    const handlePrivateGameInvite = (data: { userId: number }) => {
      console.log(data);
      setPrivateInvitation(data);
    };

    socket.on("privateGameInvitation", handlePrivateGameInvite);
    return () => {
      socket.off("privateGameInvitation", handlePrivateGameInvite);
    };
  }, [socket]);

  useLayoutEffect(() => {
    gameRef.current.ball.vX = 200;
    gameRef.current.ball.nextBounceVelocity.x = 200;
    gameRef.current.ball.nextBounceVelocity.y = 0;
  }, []);

  const inviteFriendToPlay = () => {
    if (privateGameUserId === "") {
      return;
    }
    socket.emit("privateGameRequest", {
      targetId: Number(privateGameUserId),
      powerUps: gameSettings.powerUps,
      points: gameSettings.points,
    });
  };

  const respondPrivateGameInvitation = () => {
    socket.emit("acceptPrivateGameRequest", {
      userInvitingId: privateInvitation?.userId,
    });
  };

  return (
    <div className="flex justify-center min-h-[100vh] p-5 gap-10 w-[100vw]">
      <div className="flex flex-col min-h-[100vh] p-5 gap-10 max-w-[1100px] w-full">
        <div className="relative flex gap-5 flex-wrap justify-center">
          <div className="flex-[3] relative flex justify-center w-fit group items-center">
            <GameLayout>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="absolute animate-slow-spin top-3 right-3 p-1 flex before:absolute before:top-0 before:left-0 before:content-[''] before:h-[100%] before:w-[100%] before:rounded-full before:bg-white before:opacity-20"
              >
                <SettingsRounded />
              </button>

              <button
                onClick={() => {
                  findGame.mutate();
                }}
                className="absolute flex flex-col items-center boder-[5px] border-[rgba(255,255,255,0.1)] justify-center gap-1 mt-0 hover:-translate-y-[1px] active:translate-y-0 py-3 px-4 rounded-xl bg-indigo-500 text-white font-[900] text-2xl brightness-110 shadow-[0_6px_0_0_rgba(0,0,0,0.6)]"
              >
                <div className="flex gap-2 items-center">
                  {!isFindingGame && (
                    <PlayArrowRounded style={{ margin: -5, fontSize: 30 }} />
                  )}
                  <span>
                    {!isFindingGame ? "Play Online" : "Finding a game"}
                  </span>
                </div>
                {isFindingGame && (
                  <div className="h-[3px] w-[100%] overflow-hidden flex justify-center">
                    <div className="h-full w-[70%] animate-move-left-right bg-white opacity-50"></div>
                  </div>
                )}
              </button>

              <GameCanvas gameRef={gameRef} isPaused={false} />
            </GameLayout>
          </div>

          {showSettings && (
            <GamePreferences hide={() => setShowSettings(false)} />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex gap-3 items-center group">
            <div className="h-[10px] w-[10px] flex aspect-square rounded-full bg-green-600 before:content-[''] before:rounded-full before:h-full before:w-full before:animate-ping before:bg-green-600"></div>
            <ArrowLink to={"/live"}>Live Games</ArrowLink>
          </div>
          <LiveGames />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <ArrowLink to={"/leaderboard"}>🥇 Leaderboard</ArrowLink>
          </div>
          <Leaderboard limit={3} />
        </div>
      </div>
    </div>
  );
}

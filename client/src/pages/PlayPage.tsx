import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import GameLayout from "../components/gameComponents/GameLayout";
import GamePreferences from "../components/gameSettings/GameSettings";
import LiveGames from "../components/LiveGames";
import Leaderboard from "../components/Leaderboard";
import GameCanvas from "../components/gameComponents/GameCanvas";
import { ArrowLink } from "../UIKit/ArrowLink";
import { createGamePositions } from "../../../api/src/pong/gameLogic/gamePositions";
import { PlayArrowRounded, SettingsRounded } from "@mui/icons-material";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import { FindGameMatchButton } from "../components/FindGameMatchButton";

export default function PlayPage() {
  const { gameSocket } = useContext(SocketsContext);
  const [privateInvitation, setPrivateInvitation] = useState<{
    userId: number;
  }>();
  const gameRef = useRef(createGamePositions({}));
  const [showSettings, setShowSettings] = useState(false);
  const [privateGameUserId, setPrivateGameUserId] = useState<string>("");
  const { gameSettings } = useContext(GameSettingsContext);

  useEffect(() => {
    const handlePrivateGameInvite = (data: { userId: number }) => {
      console.log(data);
      setPrivateInvitation(data);
    };

    gameSocket.on("privateGameInvitation", handlePrivateGameInvite);
    return () => {
      gameSocket.off("privateGameInvitation", handlePrivateGameInvite);
    };
  }, [gameSocket]);

  useLayoutEffect(() => {
    gameRef.current.ball.vX = 200;
    gameRef.current.ball.nextBounceVelocity.x = 200;
    gameRef.current.ball.nextBounceVelocity.y = 0;
  }, []);

  const inviteFriendToPlay = () => {
    if (privateGameUserId === "") {
      return;
    }
    gameSocket.emit("privateGameRequest", {
      targetId: Number(privateGameUserId),
      powerUps: gameSettings.powerUps,
      points: gameSettings.points,
    });
  };

  const respondPrivateGameInvitation = () => {
    gameSocket.emit("acceptPrivateGameRequest", {
      userInvitingId: privateInvitation?.userId,
    });
  };

  return (
    <div className="flex justify-center min-h-[100vh] p-5 gap-10 w-[100vw]">
      <div className="flex flex-col min-h-[100vh] p-5 gap-10 max-w-[1100px] w-full">
        <div className="flex gap-5 flex-wrap justify-center">
          <div className="flex-[3] relative flex justify-center">
            <GameLayout>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="absolute z-[2] animate-slow-spin top-3 right-3 p-1 flex before:absolute before:top-0 before:left-0 before:content-[''] before:h-[100%] before:w-[100%] before:rounded-full before:bg-white before:opacity-20"
              >
                <SettingsRounded />
              </button>

              <div className="absolute z-[2] flex flex-col gap-2">
                <FindGameMatchButton>
                  <div className="flex gap-3 items-center">
                    <PlayArrowRounded
                      style={{ margin: "-7px", fontSize: 30 }}
                    />
                    <span>Play Online</span>
                  </div>
                </FindGameMatchButton>
              </div>

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

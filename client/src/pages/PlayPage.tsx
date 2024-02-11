import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import GameLayout from "../components/gameComponents/GameLayout";
import GamePreferences from "../components/GamePreferences";
import LiveGames from "../components/LiveGames";
import Leaderboard from "../components/Leaderboard";
import { useGamePreferences } from "../utils/useGamePreferences";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import GameCanvas from "../components/gameComponents/GameCanvas";
import { ArrowLink } from "../UIKit/ArrowLink";
import { createGamePositions } from "../../../api/src/pong/gameLogic/gamePositions";
import { PlayArrowRounded, SettingsRounded } from "@mui/icons-material";
import { PublicGameRequestDto } from "../../../api/src/types/games/gameRequestsDto";

export default function PlayPage() {
  const socket = useContext(GameSocketContext);
  const [preferences, setPreferences] = useGamePreferences();
  const [privateInvitation, setPrivateInvitation] = useState<{
    userId: number;
  }>();
  const game = useMemo(() => createGamePositions({}), []);
  const navigate = useNavigate();
  const [isSearchingGame, setIsSearchingGame] = useState(false);
  const [privateGameUserId, setPrivateGameUserId] = useState<string>("");

  useEffect(() => {
    const handlePrivateGameInvite = (data: { userId: number }) => {
      console.log(data);
      setPrivateInvitation(data);
    };

    const handleGameStart = (gameId: string) => {
      setIsSearchingGame(false);
      navigate(`${gameId}`);
    };

    socket.on("privateGameInvitation", handlePrivateGameInvite);
    socket.on("gameStart", handleGameStart);
    return () => {
      socket.off("privateGameInvitation", handlePrivateGameInvite);
      socket.off("gameStart", handleGameStart);
    };
  }, [socket]);

  const findGame = useMutation({
    mutationKey: ["findMatch", preferences],
    mutationFn: async () => {
      setIsSearchingGame(true);
      const payload: PublicGameRequestDto = {
        points: preferences.points,
        powerUps: preferences.powerUps,
      };
      const res = await axios.post<any>("/api/game-requests", payload);
      return res.data;
    },
  });

  const inviteFriendToPlay = () => {
    if (privateGameUserId === "") {
      return;
    }
    socket.emit("privateGameRequest", {
      targetId: Number(privateGameUserId),
      powerUps: preferences.powerUps,
      points: preferences.points,
    });
  };

  const respondPrivateGameInvitation = () => {
    socket.emit("acceptPrivateGameRequest", {
      userInvitingId: privateInvitation?.userId,
    });
  };

  const cancelGameRequest = useMutation({
    mutationKey: ["cancelGameRequest"],
    mutationFn: async () => {
      setIsSearchingGame(false);
      const res = await axios.delete(`/api/game-requests`);
      return res.data;
    },
    onError: () => {
      // -> handle error
    },
  });

  return (
    <div className="flex justify-center min-h-[100vh] p-5 gap-10 w-[100vw]">
      <div className="flex flex-col min-h-[100vh] p-5 gap-10 max-w-[1100px]">
        <h1 className="text-4xl font-[900]">🕹️ Games</h1>

        <div className="relative flex gap-5 flex-wrap flex-col items-center">
          <div className="flex-[3] min-w-[200px] relative overflow-hidden rounded-2xl">
            {/* <GamePreferences
              preferences={preferences}
              setPreferences={setPreferences}
              setIsSearchingGame={setIsSearchingGame}
            /> */}
            <GameLayout game={game} preferences={preferences}>
              <button className="absolute animate-slow-spin top-3 right-3 p-1 flex before:absolute before:top-0 before:left-0 before:content-[''] before:h-[100%] before:w-[100%] before:rounded-full before:bg-white before:opacity-20">
                <SettingsRounded />
              </button>

              <button
                onClick={() => findGame.mutate()}
                className="absolute flex flex-col items-center justify-center gap-1 mt-0 hover:-translate-y-[1px] active:translate-y-0 py-4 px-7 rounded-full bg-indigo-600 font-[900] text-2xl shadow-button"
              >
                <div className="flex gap-3 items-center">
                  {!isSearchingGame && (
                    <PlayArrowRounded style={{ margin: -5, fontSize: 30 }} />
                  )}
                  <span>{!isSearchingGame ? "Play" : "Finding a game"}</span>
                </div>
                {isSearchingGame && (
                  <div className="h-[3px] w-[100%] overflow-hidden flex justify-center">
                    <div className="h-full w-[70%] animate-move-left-right bg-white opacity-50"></div>
                  </div>
                )}
              </button>

              <GameCanvas game={game} isPaused={true} />
            </GameLayout>
          </div>
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

import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameSocketContext } from "../contextsProviders/GameSocketContext";
import ModalLayout from "../components/ModalLayout";
import GameLayout from "../components/GameLayout";
import GamePreferences from "../components/GamePreferences";
import LiveGames from "../components/LiveGames";
import Leaderboard from "../components/Leaderboard";
import { useGamePreferences } from "../utils/useGamePreferences";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { createGamePositions } from "../../../api/src/pong/gameLogic/game";
import GameCanvas from "../components/GameCanvas";
import { ArrowLink } from "../UIKit/ArrowLink";

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
        <ModalLayout isVisible={isSearchingGame}>
          <SearchingGameInfos cancel={() => cancelGameRequest.mutate()} />
        </ModalLayout>

        <h1 className="text-4xl font-[900]">🕹️ Games</h1>

        <div className="flex gap-5 flex-wrap">
          <div className="flex-[3] min-w-[200px]">
            <GameLayout game={game} preferences={preferences}>
              <GameCanvas game={game} isPaused={true} />
            </GameLayout>
          </div>
          <div className="flex-[2] min-w-[200px]">
            <GamePreferences
              preferences={preferences}
              setPreferences={setPreferences}
              setIsSearchingGame={setIsSearchingGame}
            />
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

function SearchingGameInfos({ cancel }: { cancel: () => void }) {
  return (
    <>
      <div className="flex flex-col gap-5 items-center p-5">
        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center gap-3">
            <span className="font-[900] text-3xl">Buckle up!</span>
          </div>
          <span className="opacity-70">Looking for a game...</span>
        </div>
      </div>
      <div className="flex justify-end w-full bg-bg-2 px-5 py-3">
        <button
          onClick={cancel}
          className="hover:text-red-600 font-[600] text-base"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

import { Socket } from "socket.io-client";
import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { GameStateType } from "../../../api/src/types/game";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../ContextsProviders/UserContext";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import ModalLayout from "../components/ModalLayout";
import { GameEngineService } from "../../../api/src/pong/gameLogic/game";
import GameLayout from "../components/GameLayout";
import GamePreferences from "../components/GamePreferences";
import { GamePreferencesType } from "../types/game";
import { Rocket, RocketLaunch } from "@mui/icons-material";
import LiveGames from "../components/LiveGames";
import Leaderboard from "../components/LeaderBoard";
import { useGamePreferences } from "../utils/useGamePreferences";

export interface PlayContext {
  socket: Socket | undefined;
  user:
    | {
        id: number;
      }
    | undefined;
  gameState: GameStateType | undefined;
  setGameState: React.Dispatch<React.SetStateAction<GameStateType | undefined>>;
  privateInvitation: { userId: number } | undefined;
}

export default function PlayPage() {
  const { user } = useContext(UserContext);
  const socket = useContext(GameSocketContext);
  const [preferences, setPreferences] = useGamePreferences();
  const [privateInvitation, setPrivateInvitation] = useState<{
    userId: number;
  }>();
  const [game, setGame] = useState<GameStateType>(
    GameEngineService.createGamePositions({
      id: 0,
      playerJoinedId: user.id,
      playerJoiningId: 0,
    })
  );
  const navigation = useNavigate();
  const [isSearchingGame, setIsSearchingGame] = useState(false);
  const [privateGameUserId, setPrivateGameUserId] = useState<string>("");
  const [powerUps, setPowerUps] = useState(true);

  useEffect(() => {
    socket.on("error", (data: string) => {
      console.log(data);
    });

    socket.on("privateGameInvitation", (data: { userId: number }) => {
      console.log(data);
      setPrivateInvitation(data);
    });

    socket.on("gameStart", (gameState: GameStateType) => {
      console.log("starting game");
      navigation(`${gameState.id}`);
      setIsSearchingGame(false);
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      if (isSearchingGame) {
        cancelGameRequest();
      }
    };
  }, [socket, isSearchingGame]);

  const inviteFriendToPlay = () => {
    if (privateGameUserId === "") {
      return;
    }
    socket.emit("privateGameRequest", {
      targetId: Number(privateGameUserId),
      powerUps: powerUps,
    });
  };

  const respondPrivateGameInvitation = () => {
    socket.emit("acceptPrivateGameRequest", {
      userInvitingId: privateInvitation?.userId,
    });
  };

  const cancelGameRequest = () => {
    setIsSearchingGame(false);
    socket.emit("cancelRequest");
  };

  return (
    <div className="flex justify-center min-h-[100vh] p-5 gap-10 w-[100vw] font-title">
      <div className="flex flex-col min-h-[100vh] p-5 gap-10 max-w-[1100px]">
        {/* <h2>{user?.id}</h2>
      {/* <GameErrorModal /> */}
        {isSearchingGame && <SearchingGameModal cancel={cancelGameRequest} />}

        <h1 className="text-4xl font-[900] font-title">🕹️ Games</h1>

        <div className="flex gap-5">
          <div className="flex-[3]">
            <GameLayout game={game} preferences={preferences} />
          </div>
          <div className="flex-[2]">
            <GamePreferences
              preferences={preferences}
              setPreferences={setPreferences}
              setIsSearchingGame={setIsSearchingGame}
            />
          </div>
        </div>

        <LiveGames />
        <Leaderboard />
      </div>
    </div>
  );
}

function SearchingGameModal({ cancel }: { cancel: () => void }) {
  return (
    <ModalLayout>
      <div className="flex flex-col gap-5 items-center p-5">
        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center gap-3">
            <RocketLaunch fontSize="large" />
            <span className="font-title font-[900] text-3xl">Buckle up!</span>
          </div>

          <span className="font-title opacity-50">Looking for a game...</span>
        </div>

        <button
          onClick={cancel}
          className="hover:-translate-y-[1px] w-full active:translate-y-0 py-2 px-5 rounded-md hover:bg-red-600 bg-white bg-opacity-10 font-title font-[600] text-xl shadow-button"
        >
          Cancel
        </button>
      </div>
    </ModalLayout>
  );
}

function GameErrorModal() {
  return (
    <ModalLayout>
      <div>hello!</div>
    </ModalLayout>
  );
}

{
  /* <input
  className="text-black"
  type="text"
  value={privateGameUserId}
  onChange={(e) => setPrivateGameUserId(e.target.value)}
/>
<button onClick={inviteFriendToPlay}>Play with friend</button>
{privateInvitation && (
  <div className="bg-slate-800">
    <div>User: {privateInvitation.userId} has invited you to play</div>
    <button onClick={respondPrivateGameInvitation}>Play with user</button>
  </div>
)} */
}

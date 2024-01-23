import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import GameDisconnectionModal from "../components/GameModal";
import {
  GameErrorType,
  GameStateType,
  PlayerType,
} from "../../../api/src/types/game";
import { UserContext } from "../contextsProviders/UserContext";
import { GameSocketContext } from "../contextsProviders/GameSocketContext";
import GameLayout from "../components/GameLayout";
import { useGamePreferences } from "../utils/useGamePreferences";
import { Avatar } from "../UIKit/Avatar";
import { useGamePlayers } from "../utils/game/useGetGamePlayers";

export default function GamePage() {
  const socket = useContext(GameSocketContext);
  const { user } = useContext(UserContext);
  const [preferences] = useGamePreferences();
  const [game, setGame] = useState<GameStateType>();
  const players = useGamePlayers(game);
  const [gameRecord, setGameRecord] = useState<any>();
  const { gameId } = useParams();
  const [disconnectionCountDown, setDisconnectionCountDown] =
  useState<number>();
  const [error, setError] = useState<GameErrorType>();
  // const [viewersCount, setViewersCount] = useState<number>();

  useEffect(() => {
    const handleGameUpadte = (data: GameStateType) => {
      setGame(data);
      setDisconnectionCountDown(undefined);
    };

    // const handleViewersCountUpdate = (count: number) => {
    //   setViewersCount(count);
    // };

    const handleGameEnd = (data: any) => {
      console.log("game over!");
      setGameRecord(data);
    };

    const handleOpponentDisconnection = (data: { secondsUntilEnd: number }) => {
      setDisconnectionCountDown(data.secondsUntilEnd);
    };

    socket.emit("joinRoom", { roomId: gameId }, (res: GameErrorType) => {
      console.log(res);
      setError(res);
    });

    socket.on("updateGameState", handleGameUpadte);
    socket.on("gameEnd", handleGameEnd);
    socket.on("playerDisconnection", handleOpponentDisconnection);
    // socket.on("viewersCount", handleViewersCountUpdate);
    
    return () => {
      socket.off("updateGameState", handleGameUpadte);
      socket.off("gameEnd", handleGameEnd);
      socket.off("playerDisconnection", handleOpponentDisconnection);
      socket.emit("leaveGame", { gameId: gameId });
      // socket.off("viewersCount", handleViewersCountUpdate);
    };
  }, [socket, gameId]);

  // if (error) {
  //   return (
  //     <div className="h-[100vh] min-w-[100vw] bg-[rgb(10,11,13)] w-full p-10 flex flex-col items-center justify-center gap-5">
  //       <span className="font-[900] font-title text-2xl">
  //         There is no such game going on right now
  //       </span>
  //       <div className="font-title text-3xl">\(o_o)/</div>
  //     </div>
  //   );
  // }

  if (!game) {
    return null;
  }

  return (
    <div className="flex justify-center h-[100vh] p-5 gap-5 w-[100vw] font-title">
      <div className="flex flex-col p-5 gap-5 max-w-[1100px] justify-start items-center">
        {disconnectionCountDown && (
          <GameDisconnectionModal
            secondsBeforeGameEnd={disconnectionCountDown}
            playerUsername="KanyeWest"
          />
        )}

        {players && <PlayersInfos players={players} />}
        <GameLayout game={game} preferences={preferences} />
      </div>
    </div>
  );
}

function PlayersInfos({
  players,
}: {
  players: { left: PlayerType; right: PlayerType };
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const wrapperElement = wrapper.current;
  const canvasElement = document.getElementById("canvas-layout");

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!canvasElement || !wrapper.current) {
        return;
      }
      wrapper.current.style.width = "0px";
      wrapper.current.style.width = `${
        canvasElement.getBoundingClientRect().width
      }px`;
    };

    handleResize();
    addEventListener("resize", handleResize);
    return () => removeEventListener("resize", handleResize);
  }, [wrapperElement, canvasElement]);

  return (
    <div ref={wrapper} className="w-full flex justify-between relative">
      <div className="py-2 px-2 bg-zinc-900 rounded-lg flex items-start gap-2 shadow-card">
        <div>
          <Avatar size="md" imgUrl={undefined} userId={players.right.id} />
        </div>

        <div className="flex items-center flex-wrap gap-x-2">
          <span className="text-lg font-[700]">KanyeTheYe</span>

          <div className="text-xs font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-600 bg-opacity-10">
            765
          </div>
        </div>
      </div>

      <div className="absolute justify-self-center self-center left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
        <span className="font-gameFont text-4xl uppercase">VS</span>
      </div>

      <div className="py-2 px-2 bg-zinc-900 rounded-lg flex items-start gap-2 shadow-card">
        <div className="flex items-center flex-wrap-reverse gap-x-2 justify-end">
          <span className="text-lg font-[700]">Lucas666</span>
          <div className="text-xs font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-600 bg-opacity-10">
            765
          </div>
        </div>

        <div>
          <Avatar size="md" imgUrl={undefined} userId={players.left.id} />
        </div>
      </div>
    </div>
  );
}

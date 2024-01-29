import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import GameDisconnectionModal from "../components/PlayerDisconnectionInfos";
import {
  WsGameEndType,
  WsPlayerDisconnection,
} from "../../../api/src/types/games/socketPayloadTypes";
import { GameStateType } from "../../../api/src/types/games/pongGameTypes";
import { UserContext } from "../contextsProviders/UserContext";
import { GameSocketContext } from "../contextsProviders/GameSocketContext";
import GameLayout from "../components/GameLayout";
import { useGamePreferences } from "../utils/useGamePreferences";
import { Avatar } from "../UIKit/Avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AppGame } from "../../../api/src/types/games/returnTypes";
import ModalLayout from "../components/ModalLayout";
import { Spinner } from "../UIKit/Kit";
import GameCanvas from "../components/GameCanvas";
import { GameFinishedCard } from "../components/GameFinishedCard";

export default function GamePage() {
  const { gameId } = useParams();
  const queryClient = useQueryClient();
  const gameIdNumber = useMemo(() => Number(gameId), [gameId]);
  const socket = useContext(GameSocketContext);
  const [preferences] = useGamePreferences();
  const [game, setGame] = useState<GameStateType>();
  const [playerDisconnectionInfo, setPlayerDisconnectionInfo] =
    useState<WsPlayerDisconnection>();
  const [isPaused, setIsPaused] = useState(false);

  const gameRecord = useQuery({
    queryFn: async () => {
      const res = await axios.get<AppGame>(`/api/games/${gameIdNumber}`);
      return res.data;
    },
    queryKey: ["gameRecord", gameIdNumber],
  });

  useEffect(() => {
    const handleGameUpadte = (data: GameStateType) => {
      setGame(data);
    };

    const handleGameEnd = (data: WsGameEndType) => {
      queryClient.setQueryData(
        ["gameRecord", gameIdNumber],
        (prev: AppGame | undefined) => {
          if (!prev) return undefined;
          const prevCopy = { ...prev };
          prevCopy.winnerId = data.winnerId;
          if (prevCopy.playerOne)
            prevCopy.playerOne = { ...prevCopy.playerOne, ...data.playerOne };
          if (prevCopy.playerTwo)
            prevCopy.playerTwo = { ...prevCopy.playerTwo, ...data.playerTwo };
          return prevCopy;
        }
      );
      setPlayerDisconnectionInfo(undefined);
    };

    const handleOpponentDisconnection = (data: WsPlayerDisconnection) => {
      setPlayerDisconnectionInfo(data);
      setIsPaused(true);
    };

    socket.emit("joinRoom", { gameId: gameIdNumber });

    const handlePause = ({ isPaused }: { isPaused: boolean }) => {
      setIsPaused(isPaused);
      if (!isPaused) setPlayerDisconnectionInfo(undefined);
    };

    socket.on("updateGameState", handleGameUpadte);
    socket.on("gameEnd", handleGameEnd);
    socket.on("playerDisconnection", handleOpponentDisconnection);
    socket.on("pause", handlePause);
    return () => {
      socket.off("updateGameState", handleGameUpadte);
      socket.off("gameEnd", handleGameEnd);
      socket.off("playerDisconnection", handleOpponentDisconnection);
      socket.off("pause", handlePause);
      socket.emit("leaveGame", { gameId: gameIdNumber });
    };
  }, [socket, gameIdNumber]);

  return (
    <div className="flex justify-center h-[100vh] p-5 gap-5 w-[100vw] font-title">
      <div className="flex flex-col gap-5 max-w-[1100px] w-full justify-center items-center">
        <ModalLayout
          isVisible={!!gameRecord.data && !!gameRecord.data.winnerId}
        >
          {gameRecord.data && <GameFinishedCard game={gameRecord.data} />}
        </ModalLayout>

        <ModalLayout isVisible={!!playerDisconnectionInfo}>
          {playerDisconnectionInfo && (
            <GameDisconnectionModal
              disconnectionInfo={playerDisconnectionInfo}
              gameRecord={gameRecord.data}
            />
          )}
        </ModalLayout>

        {game && (
          <>
            <PlayersInfos gameRecord={gameRecord.data} />
            <GameLayout game={game} preferences={preferences}>
              <GameCanvas
                gameId={gameIdNumber}
                game={game}
                isPaused={isPaused}
              />
            </GameLayout>
          </>
        )}
      </div>
    </div>
  );
}

function PlayersInfos({ gameRecord }: { gameRecord: AppGame | undefined }) {
  const { user } = useContext(UserContext);
  const wrapper = useRef<HTMLDivElement>(null);
  const wrapperElement = wrapper.current;
  const canvasElement = document.getElementById("canvas-layout");
  const reverse = useMemo(
    () => user.id === gameRecord?.playerOne?.id,
    [user.id, gameRecord?.playerOne?.id]
  );

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
  }, [wrapperElement, canvasElement, !gameRecord]);

  return (
    <div
      ref={wrapper}
      style={{
        flexDirection: reverse ? "row-reverse" : "unset",
      }}
      className="w-full min-h-15 flex justify-between relative items-end"
    >
      {gameRecord ? (
        <>
          <div
            // style={{
            //   flexDirection: reverse ? "row-reverse" : "unset",
            // }}
            className="py-2 px-2 bg-zinc-900 rounded-lg flex items-end gap-2 shadow-card [flex-direction:inherit]"
          >
            <div>
              <Avatar
                size="md"
                imgUrl={undefined}
                userId={gameRecord.playerOne?.id ?? 0}
              />
            </div>

            <div className="flex items-center flex-wrap gap-x-2 [flex-direction:inherit]">
              <span className="text-lg font-[700]">
                {gameRecord.playerOne?.username ?? "unkown"}
              </span>
              <div className="text-xs font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-600 bg-opacity-10">
                {gameRecord.playerOne?.rating ?? "unkown"}
              </div>
            </div>
          </div>

          <div className="absolute justify-self-center self-center left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
            <span className="font-gameFont text-2xl uppercase">VS</span>
          </div>

          <div className="py-2 px-2 bg-zinc-900 rounded-lg flex items-end gap-2 shadow-card [flex-direction:inherit]">
            <div className="flex items-center flex-wrap-reverse gap-x-2 justify-end [flex-direction:inherit]">
              <div className="text-xs font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-600 bg-opacity-10">
                {gameRecord.playerTwo?.rating ?? "unkown"}
              </div>
              <span className="text-lg font-[700]">
                {gameRecord.playerTwo?.username ?? "unkown"}
              </span>
            </div>
            <div>
              <Avatar
                size="md"
                imgUrl={undefined}
                userId={gameRecord.playerTwo?.id ?? 0}
              />
            </div>
          </div>
        </>
      ) : (
        <Spinner isLoading={true} />
      )}
    </div>
  );
}

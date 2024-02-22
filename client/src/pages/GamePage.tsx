import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import GameDisconnectionModal from "../components/PlayerDisconnectionInfos";
import {
  WsGameEndType,
  WsGameIdType,
  WsPlayerDisconnection,
} from "../../../api/src/types/games/socketPayloadTypes";
import {
  GameStateType,
  PlayerType,
} from "../../../api/src/types/games/pongGameTypes";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import GameLayout from "../components/gameComponents/GameLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AppGame } from "../../../api/src/types/games/returnTypes";
import ModalLayout from "../UIKit/ModalLayout";
import { Spinner } from "../UIKit/Kit";
import GameCanvas from "../components/gameComponents/GameCanvas";
import { GameFinishedCard } from "../components/GameFinishedCard";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";
import { createGamePositions } from "../../../api/src/pong/gameLogic/gamePositions";
import { useGameControls } from "../utils/game/useGameControls";
import GamePreferences from "../components/gameSettings/GameSettings";
import { usePingServer } from "../utils/game/usePingServer";

export default function GamePage() {
  const { gameId } = useParams();
  const gameIdNumber = useMemo(() => Number(gameId), [gameId]);
  const queryClient = useQueryClient();
  const { gameSocket } = useContext(SocketsContext);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const [playerDisconnectionInfo, setPlayerDisconnectionInfo] =
    useState<WsPlayerDisconnection>();
  const [isPaused, setIsPaused] = useState(true);
  const [startCountdown, setStartCountdown] = useState<number>();
  const gameRef = useRef<GameStateType>(createGamePositions({}));
  const [playersPingRtt, setPlayersPingRtt] = useState([0, 0]);
  const gameRecord = useQuery({
    queryFn: async () => {
      const res = await axios.get<AppGame>(`/api/games/${gameIdNumber}`);
      return res.data;
    },
    queryKey: ["gameRecord", gameIdNumber],
  });
  useGameControls({ gameRecord: gameRecord.data, isPaused });
  const isPlayerDisconnected = usePingServer({ gameRecord: gameRecord.data });

  useEffect(() => {
    gameRef.current = createGamePositions({});
    setPlayerDisconnectionInfo(undefined);
    setShowGameSettings(false);
    setStartCountdown(undefined);
    setIsPaused(true);
  }, [gameId]);

  const updatePlayersScores = (
    playerOneScore: number,
    playerTwoScore: number
  ) => {
    queryClient.setQueryData(
      ["gameRecord", gameIdNumber],
      (prev: AppGame | undefined) => {
        if (!prev) return undefined;
        const prevCopy = { ...prev };

        if (prevCopy.playerOne) {
          prevCopy.playerOne = {
            ...prevCopy.playerOne,
            score: playerOneScore,
          };
        }

        if (prevCopy.playerTwo) {
          prevCopy.playerTwo = {
            ...prevCopy.playerTwo,
            score: playerTwoScore,
          };
        }
        return prevCopy;
      }
    );
  };

  useEffect(() => {
    const handleGameUpadte = (data: GameStateType) => {
      setIsPaused(false);
      setPlayerDisconnectionInfo(undefined);

      const newPlayersPingRtt = [
        data.playerOne.pingRtt,
        data.playerTwo.pingRtt,
      ];
      setPlayersPingRtt((prev) =>
        prev.join() === newPlayersPingRtt.join() ? prev : newPlayersPingRtt
      );

      if (
        data.playerOne.score !== gameRecord.data?.playerOne?.score ||
        data.playerTwo.score !== gameRecord.data?.playerTwo?.score
      ) {
        updatePlayersScores(data.playerOne.score, data.playerTwo.score);
      }
      gameRef.current = data;
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
      setIsPaused(true);
    };

    const handleOpponentDisconnection = (data: WsPlayerDisconnection) => {
      if (data.secondsUntilEnd === 0) {
        setPlayerDisconnectionInfo(undefined);
      } else {
        setPlayerDisconnectionInfo(data);
      }
      setIsPaused(true);
    };

    const handleGameStartCountdown = (countdown: number) => {
      setStartCountdown(countdown);
      if (!countdown) setIsPaused(false);
    };

    const handlePlayerMoveUpdate = (player: PlayerType) => {
      if (player.id === gameRef.current.playerOne.id) {
        gameRef.current.playerOne = player;
      } else {
        gameRef.current.playerTwo = player;
      }
    };

    gameSocket.on("updateGameState", handleGameUpadte);
    gameSocket.on("playerMoveUpdate", handlePlayerMoveUpdate);
    gameSocket.on("gameEnd", handleGameEnd);
    gameSocket.on("playerDisconnection", handleOpponentDisconnection);
    gameSocket.on("startCountdown", handleGameStartCountdown);
    return () => {
      gameSocket.off("updateGameState", handleGameUpadte);
      gameSocket.off("playerMoveUpdate", handlePlayerMoveUpdate);
      gameSocket.off("gameEnd", handleGameEnd);
      gameSocket.off("playerDisconnection", handleOpponentDisconnection);
      gameSocket.off("startCountdown", handleGameStartCountdown);
    };
  }, [gameSocket, gameIdNumber]);

  useEffect(() => {
    const payload: WsGameIdType = { gameId: gameIdNumber };
    gameSocket.emit("joinRoom", payload);
    return () => {
      gameSocket.emit("leaveGame", payload);
    };
  }, [gameSocket, gameIdNumber]);

  if (gameRecord.error) {
    return <div>We could not find this game</div>;
  }

  return (
    <div className="flex justify-center h-[100vh] p-5 gap-5 w-[100vw] font-title">
      <div className="max-w-[1100px] contents">
        {gameRecord.data && gameRecord.data.winnerId && !showGameSettings && (
          <ModalLayout>
            <GameFinishedCard
              game={gameRecord.data}
              showSettings={() => setShowGameSettings(true)}
            />
          </ModalLayout>
        )}

        {showGameSettings && (
          <ModalLayout>
            <GamePreferences hide={() => setShowGameSettings(false)} />
          </ModalLayout>
        )}

        {gameRecord.data &&
          playerDisconnectionInfo &&
          !isPlayerDisconnected && (
            <ModalLayout isLoading={gameRecord.isPending}>
              <GameDisconnectionModal
                disconnectionInfo={playerDisconnectionInfo}
                gameRecord={gameRecord.data}
              />
            </ModalLayout>
          )}

        {!!startCountdown && (
          <div className="animate-fadein bg-black bg-opacity-80 fixed top-0 left-0 h-full w-full z-10 flex items-center justify-center">
            <div className="p-5 text-8xl font-gameFont flex items-center justify-center animate-scalein">
              <InfiniteSlotMachine state={startCountdown ?? 0} />
            </div>
          </div>
        )}

        {gameRecord.data ? (
          <div className="flex pt-[calc(40px+1.25rem)]">
            <GameLayout
              gameRecord={gameRecord.data}
              playersPingRtt={playersPingRtt}
              isDisconnected={isPlayerDisconnected}
            >
              <GameCanvas gameRef={gameRef} isPaused={isPaused} />
            </GameLayout>
          </div>
        ) : (
          <Spinner isLoading={true} />
        )}
      </div>
    </div>
  );
}

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import GameDisconnectionModal from "../components/PlayerDisconnectionInfos";
import {
  WsGameEndType,
  WsGameIdType,
  WsPlayerDisconnection,
} from "@api/types/gameServer/socketPayloadTypes";
import { GameStateType, PlayerType } from "@api/types/gameServer/pongGameTypes";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import GameLayout from "../components/gameComponents/GameLayout";
import { useQueryClient } from "@tanstack/react-query";
import { UserGame } from "@api/types/games";
import ModalLayout from "../UIKit/ModalLayout";
import { Spinner } from "../UIKit/Kit";
import GameCanvas from "../components/gameComponents/GameCanvas";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";
import { createGamePositions } from "@api/pong/gameLogic/gamePositions";
import { useGameControls } from "../utils/game/useGameControls";
import { usePingServer } from "../utils/game/usePingServer";
import { UserAchievement } from "@api/types/achievements";
import { NewGameAchievements } from "../components/achievements/NewGameAchievements";
import { useGameRequest } from "../utils/useGameRequest";
import { useGameInvitations } from "../utils/useGameInvitations";
import { GameFinishedModal } from "../components/GameFinishedModal";
import { useFetchGame } from "../utils/useFetchGame";

export default function GamePage() {
  const { gameId } = useParams();
  const gameIdToNumber = useMemo(() => Number(gameId), [gameId]);
  const queryClient = useQueryClient();
  const { gameSocket, gameSocketOn, gameSocketOff } =
    useContext(SocketsContext);
  const [playerDisconnectionInfo, setPlayerDisconnectionInfo] =
    useState<WsPlayerDisconnection>();
  const [isPaused, setIsPaused] = useState(true);
  const [startCountdown, setStartCountdown] = useState<number>();
  const gameRef = useRef<GameStateType>(createGamePositions({}));
  const [achievements, setAchievements] = useState<UserAchievement[]>();
  const [playersPingRtt, setPlayersPingRtt] = useState([0, 0]);
  const gameRecord = useFetchGame(gameIdToNumber);
  useGameControls({ gameRecord: gameRecord.data, isPaused });
  const isPlayerDisconnected = usePingServer({ gameRecord: gameRecord.data });
  const gameRequest = useGameRequest();
  const gameInvitations = useGameInvitations();

  useEffect(() => {
    gameRef.current = createGamePositions({});
    setPlayerDisconnectionInfo(undefined);
    setStartCountdown(undefined);
    setIsPaused(true);
    setAchievements(undefined);
  }, [gameId]);

  const updatePlayersScores = (
    playerOneScore: number,
    playerTwoScore: number
  ) => {
    queryClient.setQueryData(
      ["gameRecord", gameIdToNumber],
      (prev: UserGame | undefined) => {
        if (!prev) return undefined;
        const prevCopy = { ...prev };

        prevCopy.playerOne = {
          ...prevCopy.playerOne,
          score: playerOneScore,
        };

        prevCopy.playerTwo = {
          ...prevCopy.playerTwo,
          score: playerTwoScore,
        };
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
        data.playerOne.score !== gameRecord.data?.playerOne.score ||
        data.playerTwo.score !== gameRecord.data?.playerTwo.score
      ) {
        updatePlayersScores(data.playerOne.score, data.playerTwo.score);
      }
      gameRef.current = data;
    };

    const handleGameEnd = (data: WsGameEndType) => {
      queryClient.setQueryData(
        ["gameRecord", gameIdToNumber],
        (prev: UserGame | undefined) => {
          if (!prev || data.id !== gameRecord.data?.id) return undefined;

          const prevCopy = { ...prev };
          prevCopy.winnerId = data.winnerId;
          prevCopy.playerOne = {
            ...prevCopy.playerOne,
            rating: prevCopy.playerOne.rating + data.playerOneRatingChange,
            ratingChange: data.playerOneRatingChange,
            score: data.playerOneScore,
          };
          prevCopy.playerTwo = {
            ...prevCopy.playerTwo,
            rating: prevCopy.playerTwo.rating + data.playerTwoRatingChange,
            ratingChange: data.playerTwoRatingChange,
            score: data.playerTwoScore,
          };
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

    const handleNewAchievements = (newAchievements: UserAchievement[]) => {
      setAchievements(newAchievements);
    };

    gameSocketOn("updateGameState", handleGameUpadte);
    gameSocketOn("playerMoveUpdate", handlePlayerMoveUpdate);
    gameSocketOn("gameEnd", handleGameEnd);
    gameSocketOn("playerDisconnection", handleOpponentDisconnection);
    gameSocketOn("startCountdown", handleGameStartCountdown);
    gameSocketOn("achievements", handleNewAchievements);
    return () => {
      gameSocketOff("updateGameState", handleGameUpadte);
      gameSocketOff("playerMoveUpdate", handlePlayerMoveUpdate);
      gameSocketOff("gameEnd", handleGameEnd);
      gameSocketOff("playerDisconnection", handleOpponentDisconnection);
      gameSocketOff("startCountdown", handleGameStartCountdown);
      gameSocketOff("achievements", handleNewAchievements);
    };
  }, [gameSocketOn, gameSocketOff, gameIdToNumber, gameRecord.data?.id]);

  useEffect(() => {
    const payload: WsGameIdType = { gameId: gameIdToNumber };
    gameSocket.emit("joinRoom", payload);
    return () => {
      gameSocket.emit("leaveGame", payload);
    };
  }, [gameSocket, gameIdToNumber]);

  if (gameRecord.error) {
    return (
      <div className="h-[100vh] w-full flex items-center justify-center">
        We could not find this game
      </div>
    );
  }

  if (!gameRecord.data) {
    return (
      <div className="h-[100vh] w-full flex items-center justify-center">
        <Spinner isLoading={true} />
      </div>
    );
  }

  return (
    <div className="flex justify-center h-[100vh] p-5 gap-5">
      <div className="max-w-[1100px] contents">
        {(gameRequest.data || gameInvitations.data?.length) &&
        gameRecord.data.winnerId != null ? null : achievements ? (
          <ModalLayout>
            <NewGameAchievements
              achievements={achievements}
              hide={() => setAchievements(undefined)}
            />
          </ModalLayout>
        ) : playerDisconnectionInfo && !isPlayerDisconnected ? (
          <ModalLayout>
            <GameDisconnectionModal
              disconnectionInfo={playerDisconnectionInfo}
              gameRecord={gameRecord.data}
            />
          </ModalLayout>
        ) : !!startCountdown ? (
          <div className="animate-fadein bg-black bg-opacity-80 fixed top-0 left-0 h-full w-full z-10 flex items-center justify-center">
            <div className="p-5 text-8xl font-gameFont flex items-center justify-center animate-scalein">
              <InfiniteSlotMachine state={startCountdown} />
            </div>
          </div>
        ) : gameRecord.data.winnerId ? (
          <GameFinishedModal gameRecord={gameRecord.data} />
        ) : null}

        <div className="flex pt-[calc(40px+1.25rem)]">
          <GameLayout
            gameRecord={gameRecord.data}
            playersPingRtt={playersPingRtt}
            isDisconnected={isPlayerDisconnected}
          >
            <GameCanvas gameRef={gameRef} isPaused={isPaused} />
          </GameLayout>
        </div>
      </div>
    </div>
  );
}

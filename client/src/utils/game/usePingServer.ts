import { useContext, useEffect, useState } from "react";
import { WsGameIdType } from "../../../../api/src/types/games/socketPayloadTypes";
import { GameSocketContext } from "../../ContextsProviders/GameSocketContext";
import { useIsUserAPlayer } from "./useIsUserAPlayer";
import { AppGame } from "../../../../api/src/types/games/returnTypes";
import { PLAYER_PING_INTERVAL } from "../../../../api/src/pong/gameLogic/constants";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const usePingServer = ({
  gameRecord,
}: {
  gameRecord: AppGame | undefined;
}) => {
  const socket = useContext(GameSocketContext);
  const { addError } = useContext(ErrorContext);
  const isUserAPlayer = useIsUserAPlayer({ gameRecord });
  const isOver = gameRecord?.winnerId;
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    if (!isUserAPlayer || !gameRecord?.id || isOver) return;
    let timeoutId: NodeJS.Timeout | undefined = undefined;

    const intervalId = setInterval(() => {
      const payload: WsGameIdType = { gameId: gameRecord.id };
      socket.emit("ping", payload);
      timeoutId = setTimeout(() => {
        setIsDisconnected(true);
        addError({ message: "You got disconnected from the game" });
      }, 500);
    }, PLAYER_PING_INTERVAL);

    const handlePong = (acknowledge: any) => {
      clearTimeout(timeoutId);
      acknowledge("client");
      setIsDisconnected(false);
    };

    socket.on("pong", handlePong);
    return () => {
      socket.off("pong", handlePong);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [socket, isUserAPlayer, gameRecord?.id, isOver]);

  return isDisconnected;
};

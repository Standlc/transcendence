import { useContext, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { WsPlayerMove } from "../../../../api/src/types/gameServer/socketPayloadTypes";
import { UserGame } from "../../../../api/src/types/games";
import { useIsUserAPlayer } from "./useIsUserAPlayer";

const MOVES: Record<string, "up" | "down"> = {
  ArrowUp: "up",
  ArrowDown: "down",
};

export const useGameControls = ({
  gameRecord,
  isPaused,
}: {
  gameRecord: UserGame | undefined | null;
  isPaused: boolean;
}) => {
  const { gameId } = useParams();
  const gameIdNumber = useMemo(() => Number(gameId), [gameId]);
  const { gameSocket } = useContext(SocketsContext);
  const currMove = useRef<"stop" | "up" | "down">("stop");
  const isUserAPlayer = useIsUserAPlayer({ gameRecord });

  useEffect(() => {
    if (!isUserAPlayer || isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        currMove.current = MOVES[e.key];
        const payload: WsPlayerMove = {
          gameId: gameIdNumber,
          move: MOVES[e.key],
        };
        gameSocket.emit("playerMove", payload);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        (e.key === "ArrowUp" && currMove.current === "up") ||
        (e.key === "ArrowDown" && currMove.current === "down")
      ) {
        currMove.current = "stop";
        const payload: WsPlayerMove = {
          gameId: gameIdNumber,
          move: "stop",
        };
        gameSocket.emit("playerMove", payload);
      }
    };

    addEventListener("keydown", handleKeyDown);
    addEventListener("keyup", handleKeyUp);
    return () => {
      removeEventListener("keydown", handleKeyDown);
      removeEventListener("keyup", handleKeyUp);
    };
  }, [isUserAPlayer, isPaused, gameSocket]);
};

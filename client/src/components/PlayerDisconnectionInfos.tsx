import { useContext, useMemo } from "react";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";
import { UserContext } from "../ContextsProviders/UserContext";
import { AppGame } from "../../../api/src/types/games/returnTypes";
import { WsPlayerDisconnection } from "../../../api/src/types/games/socketPayloadTypes";
import { PlayerQuickInfos } from "./GameFinishedCard";

export default function PlayerDisconnectionInfos({
  disconnectionInfo,
  gameRecord,
}: {
  disconnectionInfo: WsPlayerDisconnection;
  gameRecord: AppGame;
}) {
  const { user } = useContext(UserContext);

  const players = useMemo(() => {
    if (!gameRecord.playerOne || !gameRecord.playerTwo) return undefined;
    if (disconnectionInfo.userId === gameRecord.playerOne?.id) {
      return {
        disconnected: gameRecord.playerOne,
        other: gameRecord.playerTwo,
      };
    }
    return {
      disconnected: gameRecord.playerTwo,
      other: gameRecord.playerOne,
    };
  }, [disconnectionInfo, gameRecord?.playerOne, gameRecord?.playerTwo]);

  if (!players) {
    return null;
  }

  return (
    <div className="flex-col gap-5 p-5 flex items-center justify-center rounded-lg max-w-80">
      <div className="flex flex-col items-center mb-2 text-center">
        <div className="text-2xl font-extrabold ont-extrabold">
          <span className="mr-2">{players.disconnected.username}</span>
          <span>is not connected</span>
        </div>
        {/* <span className="opacity-50">
          The opponent is not connected to the game
        </span> */}
        <span className="opacity-50 break-words">
          The game will end if the player doesn't reconnect before the timeout
        </span>
      </div>

      <div className="flex flex-col gap-5 justify-center w-full">
        <PlayerQuickInfos
          player={gameRecord.playerOne}
          winnerId={players.other.id}
          isDisconnected={players.disconnected.id === gameRecord.playerOne?.id}
        />

        <span className="flex absolute items-center gap-2 self-center font-gameFont text-xl">
          <span>{gameRecord.playerOne?.score ?? "Unkown"}</span>
          <span className="text-xs">-</span>
          <span>{gameRecord.playerTwo?.score ?? "Unkown"}</span>
        </span>

        <PlayerQuickInfos
          player={gameRecord.playerTwo}
          winnerId={players.other.id}
          isDisconnected={players.disconnected.id === gameRecord.playerTwo?.id}
          style={{
            flexDirection: "row-reverse",
            alignItems: "end",
          }}
        />
      </div>

      <div className="flex flex-col items-center justify-start gap-1 text-white mt-2">
        <span className="text-base opacity-50">
          {players.other.id === user.id
            ? "You win "
            : players.other.username + " wins "}
          in
        </span>
        <span className="text-5xl font-extrabold">
          <InfiniteSlotMachine state={disconnectionInfo.secondsUntilEnd} />
        </span>
      </div>
    </div>
  );
}

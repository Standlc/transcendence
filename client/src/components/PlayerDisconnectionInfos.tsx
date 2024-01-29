import { useContext, useMemo } from "react";
import { Avatar } from "../UIKit/Avatar";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";
import { UserContext } from "../contextsProviders/UserContext";
import { AppGame } from "../../../api/src/types/games/returnTypes";
import { WsPlayerDisconnection } from "../../../api/src/types/games/socketPayloadTypes";

export default function PlayerDisconnectionInfos({
  disconnectionInfo,
  gameRecord,
}: {
  disconnectionInfo: WsPlayerDisconnection;
  gameRecord: AppGame;
}) {
  const { user } = useContext(UserContext);

  const players = useMemo(() => {
    if (!gameRecord.playerOne || !gameRecord.playerTwo)
      return undefined;
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
    <div className="font-title flex-col gap-5 bg-opacity-100 p-5 flex items-center justify-center border-solid border-[rgb(255,255,255,0.2)] rounded-lg">
      <div className="text-2xl font-title flex items-end rounded-lg">
        <div className="mr-3">
          <Avatar
            imgUrl={players.disconnected.avatarUrl}
            size="md"
            userId={players.disconnected.id}
          />
        </div>

        <span className="font-[700] mr-2">{players.disconnected.username}</span>
        <span className="font-[700]">left the game</span>
      </div>

      <div className="flex justify-start gap-2 text-white opacity-50">
        <span className="text-xl font-title">
          {players.other.id === user.id
            ? "You win"
            : players.other.username + " wins "}
          in
        </span>
        <span className="text-xl font-title">
          <InfiniteSlotMachine state={disconnectionInfo.secondsUntilEnd} />
        </span>
      </div>
    </div>
  );
}

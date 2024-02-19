import { AppGame, AppPlayer } from "../../../api/src/types/games/returnTypes";
import { Avatar } from "../UIKit/Avatar";
import { memo, useMemo } from "react";
import { EmojiEventsRounded } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useIsUserAPlayer } from "../utils/game/useIsUserAPlayer";
import { FindGameMatchButton } from "./FindGameMatchButton";

export const GameFinishedCard = memo(
  ({ game, showSettings }: { game: AppGame; showSettings: () => void }) => {
    const isUserAPlayer = useIsUserAPlayer({ gameRecord: game });

    const { playerOne, playerTwo } = game;
    const winner = useMemo(
      () => (playerOne?.id === game.winnerId ? playerOne : playerTwo),
      [game.winnerId]
    );

    return (
      <div className="relative transition origin-bottom shadow-card min-w-[200px] flex-1 rounded-md p-5 flex items-center justify-center">
        <div className="flex flex-col w-full justify-center gap-5">
          <span className="font-[900] text-center text-3xl bg-bg-1 mb-3">
            {winner?.username} won!
          </span>

          <div className="flex flex-col gap-5 justify-center">
            <PlayerQuickInfos player={playerOne} winnerId={winner?.id} />

            <span className="flex absolute items-center gap-2 self-center font-gameFont text-xl">
              <span>{playerOne?.score ?? "Unkown"}</span>
              <span className="text-xs">-</span>
              <span>{playerTwo?.score ?? "Unkown"}</span>
            </span>

            <PlayerQuickInfos
              player={playerTwo}
              winnerId={winner?.id}
              style={{
                flexDirection: "row-reverse",
                alignItems: "end",
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FindGameMatchButton>
              <span>{isUserAPlayer ? "New Game" : "Play Online"}</span>
            </FindGameMatchButton>
            <div className="flex gap-2 w-full mt-1">
              <Link
                to={"/play"}
                className="bg-white flex-1 text-center bg-opacity-10 text-opacity-100 rounded-md py-2 font-extrabold text-base active:translate-y-[1px]"
              >
                Leave
              </Link>
              <button
                onClick={showSettings}
                className="bg-white flex-1 text-center bg-opacity-10 text-opacity-100 rounded-md py-2 font-extrabold text-base active:translate-y-[1px]"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export const PlayerQuickInfos = ({
  player,
  winnerId,
  style,
  isDisconnected,
}: {
  player: AppPlayer | null;
  winnerId: number | undefined;
  style?: React.CSSProperties;
  isDisconnected?: boolean;
}) => {
  return (
    <div
      style={{ ...style, opacity: isDisconnected ? 0.4 : 1 }}
      className="flex font-extrabold items-start gap-3 flex-1"
    >
      <PlayerAvatar player={player} winnerId={winnerId} />
      <div className="flex gap-3 [flex-direction:inherit] items-center">
        <span className="text-lg">{player?.username ?? "Unkown"}</span>
        <div className="text-sm text-indigo-400 rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
          {player?.rating ?? "Unkown"}
        </div>
      </div>
    </div>
  );
};

const PlayerAvatar = ({
  player,
  winnerId,
}: {
  player: AppPlayer | null;
  winnerId: number | undefined;
}) => {
  const isWinner = winnerId === player?.id;

  return (
    <div
      style={{
        borderStyle: !isWinner ? "hidden" : "solid",
      }}
      className="relative border-[5px] overflow-hidden rounded-md border-indigo-600"
    >
      <div style={{ margin: isWinner ? "-5px" : "" }} className="relative">
        <Avatar imgUrl={undefined} size="lg" userId={player?.id ?? 0} />
      </div>
      {winnerId === player?.id && (
        <div className="absolute -bottom-[5px] -right-[5px] rounded-md bg-indigo-600 text-yellow-400 h-[26px] w-[26px] flex items-center justify-center">
          <EmojiEventsRounded style={{ fontSize: 20 }} />
        </div>
      )}
    </div>
  );
};

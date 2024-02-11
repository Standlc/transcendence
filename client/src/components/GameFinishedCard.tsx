import { useNavigate } from "react-router-dom";
import { AppGame, AppPlayer } from "../../../api/src/types/games/returnTypes";
import { Avatar } from "../UIKit/Avatar";
import { memo, useMemo } from "react";
import { EmojiEventsRounded } from "@mui/icons-material";

export const GameFinishedCard = memo(({ game }: { game: AppGame }) => {
  const navigate = useNavigate();
  const { playerOne, playerTwo } = game;
  const winner = useMemo(
    () => (playerOne?.id === game.winnerId ? playerOne : playerTwo),
    [game.winnerId]
  );

  return (
    <div
      onClick={() => navigate(`/play/${game.id}`)}
      className="relative transition origin-bottom shadow-card min-w-[200px] flex-1 rounded-md p-5 flex items-center justify-center"
    >
      <div className="flex flex-col w-full justify-center gap-5">
        <span className="font-[900] text-center text-2xl">
          {winner?.username} won
        </span>

        <div className="flex flex-col gap-3 justify-center">
          <div className="flex items-start gap-3 flex-1">
            <PlayerAvatar player={playerOne} winnerId={winner?.id} />
            <span className="text-lg font-title font-bold">
              {playerOne?.username ?? "Unkown"}
            </span>
            <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
              {playerOne?.rating ?? "Unkown"}
            </div>
          </div>

          <span className="flex -my-7 items-center gap-2 self-center font-gameFont text-xl">
            <span>{playerOne?.score ?? "Unkown"}</span>
            <span className="text-xs">-</span>
            <span>{playerTwo?.score ?? "Unkown"}</span>
          </span>

          <div className="flex items-end gap-3 self-end">
            <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
              {playerTwo?.rating ?? "Unkown"}
            </div>
            <span className="text-lg font-title font-bold">
              {playerTwo?.username ?? "Unkown"}
            </span>
            <PlayerAvatar player={playerTwo} winnerId={winner?.id} />
          </div>
        </div>

        <button
          // onClick={() => findGame.mutate()}
          className="flex flex-col items-center justify-center gap-1 mt-0 hover:-translate-y-[1px] active:translate-y-0 py-4 px-7 rounded-2xl bg-indigo-600 font-[900] text-2xl shadow-button"
        >
          <div className="flex gap-3 items-center">
            {/* {!isSearchingGame && (
              <PlayArrowRounded style={{ margin: -5, fontSize: 30 }} />
            )} */}
            {/* <span>{!isSearchingGame ? "Play" : "Finding a game"}</span> */}
            <span>New game</span>
          </div>
          {/* {isSearchingGame && (
            <div className="h-[3px] w-[100%] overflow-hidden flex justify-center">
              <div className="h-full w-[70%] animate-move-left-right bg-white opacity-50"></div>
            </div>
          )} */}
        </button>
      </div>
    </div>
  );
});

const PlayerAvatar = ({
  player,
  winnerId,
}: {
  player: AppPlayer | null;
  winnerId: number | undefined;
}) => {
  return (
    <div
      style={{
        borderStyle: winnerId !== player?.id ? "hidden" : "solid",
      }}
      className="relative border-[5px] overflow-hidden rounded-xl border-indigo-600"
    >
      <Avatar imgUrl={undefined} size="lg" userId={player?.id ?? 0} />
      {winnerId === player?.id && (
        <div className="absolute -bottom-[5px] -right-[5px] rounded-md bg-indigo-600 text-yellow-400 h-[26px] w-[26px] flex items-center justify-center">
          <EmojiEventsRounded style={{ fontSize: 20 }} />
        </div>
      )}
    </div>
  );
};

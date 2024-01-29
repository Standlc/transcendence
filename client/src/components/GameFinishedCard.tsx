import { useNavigate } from "react-router-dom";
import { AppGame } from "../../../api/src/types/games/returnTypes";
import { Avatar } from "../UIKit/Avatar";
import { memo } from "react";

export const GameFinishedCard = memo(({ game }: { game: AppGame }) => {
  const navigate = useNavigate();
  const { playerOne, playerTwo } = game;

  return (
    <div
      onClick={() => navigate(`/play/${game.id}`)}
      className="relative cursor-pointer transition hover:scale-[1.01] origin-bottom hover:shadow-card-xl ease-out shadow-card min-w-[200px] flex-1 rounded-md p-5 flex items-center justify-center"
    >
      <div className="flex flex-col w-full justify-center gap-14">
        <div className="flex items-start gap-3 flex-1">
          <Avatar imgUrl={undefined} size="xl" userId={playerOne?.id ?? 0} />
          <div className="flex items-center gap-2">
            <span className="text-xl font-title font-bold">
              {playerOne?.username ?? "Unkown"}
            </span>
            <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
              {playerOne?.rating ?? "Unkown"}
            </div>
          </div>
        </div>

        <span className="flex items-center gap-2 absolute self-center font-gameFont text-xl">
          <span>{playerOne?.score ?? "Unkown"}</span>
          <span className="text-xs">-</span>
          <span>{playerTwo?.score ?? "Unkown"}</span>
        </span>

        <div className="flex items-end gap-3 self-end">
          <div className="flex items-center gap-2">
            <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
              {playerTwo?.rating ?? "Unkown"}
            </div>
            <span className="text-xl font-title font-bold">
              {playerTwo?.username ?? "Unkown"}
            </span>
          </div>
          <Avatar imgUrl={undefined} size="xl" userId={playerTwo?.id ?? 0} />
        </div>
      </div>
    </div>
  );
});

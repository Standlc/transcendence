import { UserAchievement } from "@api/types/achievements";
import { Achievement } from "./Achievement";

export const NewGameAchievements = ({
  achievements,
  hide,
}: {
  achievements: UserAchievement[];
  hide: () => void;
}) => {
  const isPlural = achievements.length > 1;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="w-full flex flex-col items-center">
        <span className="text-2xl font-extrabold">
          New achivement{isPlural ? "s" : ""} unlocked!
        </span>
        <span className="opacity-50">
          You unlocked {achievements.length} new achivement{isPlural ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-scroll overflow-x-auto p-2 -m-2">
        {achievements.map((achievement, i) => {
          return <Achievement key={i} achievement={achievement} />;
        })}
      </div>
      <button
        onClick={hide}
        className="self-end font-bold text-base opacity-50 hover:opacity-100"
      >
        Close
      </button>
    </div>
  );
};

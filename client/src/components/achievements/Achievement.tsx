import { UserAchievement } from "@api/types/achievements";
import { AchievementInfosType } from "../../types/achievements";
import { useMemo } from "react";
import { Check, EmojiEvents, Lock } from "@mui/icons-material";
import { ACHIEVEMENTS_INFOS } from "../../utils/achievementsDescriptions";
import { formatDate } from "../../utils/timeFormating";

const ACHIEVEMENTS_LEVELS_COLORS = {
  1: "#ff924b",
  2: "#d5d5d5",
  3: "#ffdd00",
};

export const Achievement = ({
  achievement,
}: {
  achievement: UserAchievement;
}) => {
  const achievementMeta: AchievementInfosType | undefined = useMemo(
    () => (ACHIEVEMENTS_INFOS as any)[achievement.type],
    [achievement]
  );

  if (!achievementMeta) {
    return null;
  }

  return (
    <div className="flex-1 p-3 rounded-md bg-white bg-opacity-5 flex gap-3 items-center shadow-md">
      <div
        style={
          achievement.level
            ? { color: (ACHIEVEMENTS_LEVELS_COLORS as any)[achievement.level] }
            : undefined
        }
        className="h-[50px] text-indigo-400 aspect-square bg-black bg-opacity-30 flex items-center justify-center rounded-full"
      >
        <EmojiEvents style={{ fontSize: 35 }} />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1 opacity-50">
          <Check style={{ fontSize: 12, margin: 0 }} />
          <span className="text-xs leading-none font-bold">
            {formatDate(achievement.updatedAt as any)}
          </span>
        </div>

        <span className="font-extrabold text-xl flex items-center gap-2">
          {achievementMeta.title}
          {achievement.level ? (
            <span className="opacity-50">({achievement.level}/3)</span>
          ) : null}
        </span>
        <span className="text-sm opacity-50">
          {achievementMeta.description(achievement.level)}
        </span>
      </div>
    </div>
  );
};

export const LockedAchievement = ({
  achievement,
  currentLevel,
}: {
  achievement: AchievementInfosType;
  currentLevel: number | undefined;
}) => {
  return (
    <div className="p-3 rounded-md bg-white bg-opacity-5 flex gap-3 items-center">
      <div className="h-[50px] aspect-square bg-black bg-opacity-30 flex items-center justify-center rounded-full">
        <EmojiEvents style={{ fontSize: 35, opacity: 0.5 }} />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1 opacity-50">
          <Lock style={{ fontSize: 10, margin: 0 }} />
          <span className="text-xs leading-none font-bold">Locked</span>
        </div>

        <span className="font-extrabold text-xl flex items-center gap-2 opacity-50">
          {achievement.title}
          {currentLevel !== undefined ? (
            <span>({currentLevel + 1}/3)</span>
          ) : null}
        </span>
        <span className="text-sm opacity-50">
          {achievement.lockedDescription(currentLevel ? currentLevel + 1 : 1)}
        </span>
      </div>
    </div>
  );
};

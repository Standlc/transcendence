import { UserAchievement } from "@api/types/achievements";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AchievementInfosType } from "../types/achievements";
import { useMemo } from "react";
import { ACHIEVEMENTS_INFOS } from "./achievementsDescriptions";

export const useUserAchievements = ({
  userId,
  getLockedAchievents,
}: {
  userId: number;
  getLockedAchievents?: boolean;
}) => {
  const achievements = useQuery({
    queryKey: ["userAchievements", userId],
    queryFn: async () => {
      const res = await axios.get<UserAchievement[]>(
        `/api/achievements/${userId}`
      );
      return res.data;
    },
  });

  const lockedAchievements: AchievementInfosType[] = useMemo(() => {
    if (!achievements.data || !getLockedAchievents) return [];
    return Object.values(ACHIEVEMENTS_INFOS).filter(
      (a) =>
        !achievements.data.some((userAchievement) => {
          const isInProgress =
            a.hasLevels && userAchievement.level && userAchievement.level !== 3;
          return userAchievement.type === a.type && !isInProgress;
        })
    );
  }, [achievements.data, getLockedAchievents]);

  return { achievements, lockedAchievements };
};

import { ACHIEVEMENTS } from "@api/types/achievements";

export type AchievementInfosType = {
  title: string;
  type: ACHIEVEMENTS;
  description: (lvl: number) => string;
  lockedDescription: (lvl: number) => string;
  hasLevels?: boolean;
};

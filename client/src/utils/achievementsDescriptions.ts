import {
  ACHIEVEMENTS,
  MARATHON_MAN_ACHIEVEMENT_TIME,
  QUICK_WITTED_ACHIEVEMENT_TIME,
  ROOKIE_RISER_LEVELS,
  SOCIAL_BUTTERFLY_LEVELS,
  VETERAN_LEVELS,
  WINNING_STREAK_LEVELS,
} from "@api/types/achievements";
import { AchievementInfosType } from "../types/achievements";

export const ACHIEVEMENTS_INFOS: Record<ACHIEVEMENTS, AchievementInfosType> = {
  [ACHIEVEMENTS.FIRST_VICTORY]: {
    title: "First Victory",
    type: ACHIEVEMENTS.FIRST_VICTORY,
    description: () => "Won their first game",
    lockedDescription: () => "Win your first game",
  },
  [ACHIEVEMENTS.SHUTOUT]: {
    title: "Shutout",
    type: ACHIEVEMENTS.SHUTOUT,
    description: () => `Won a game without the opponent scoring any points`,
    lockedDescription: () =>
      "Win a game without the opponent scoring any points",
  },
  [ACHIEVEMENTS.SOCIAL_BUTTERFLY]: {
    title: "Social Butterfly",
    type: ACHIEVEMENTS.SOCIAL_BUTTERFLY,
    description: (lvl: number) =>
      `Played with ${(SOCIAL_BUTTERFLY_LEVELS as any)[lvl]} different players`,
    lockedDescription: (lvl: number) =>
      `Play with ${(SOCIAL_BUTTERFLY_LEVELS as any)[lvl]} different players`,
    hasLevels: true,
  },
  [ACHIEVEMENTS.UNDERDOG_VICTORY]: {
    title: "Underdog Victory",
    type: ACHIEVEMENTS.UNDERDOG_VICTORY,
    description: () => "Won against a player with a higher ranking",
    lockedDescription: () => "Win against a player with a higher ranking",
  },
  [ACHIEVEMENTS.VETERAN_PLAYER]: {
    title: "Veteran Player",
    type: ACHIEVEMENTS.VETERAN_PLAYER,
    description: (lvl: number) =>
      `Played ${(VETERAN_LEVELS as any)[lvl]} games`,
    lockedDescription: (lvl: number) =>
      `Play ${(VETERAN_LEVELS as any)[lvl]} games`,
    hasLevels: true,
  },
  [ACHIEVEMENTS.WINNING_STREAK]: {
    title: "Winning Streak",
    type: ACHIEVEMENTS.WINNING_STREAK,
    description: (lvl: number) =>
      `Won ${(WINNING_STREAK_LEVELS as any)[lvl]} games in a row`,
    lockedDescription: (lvl: number) =>
      `Win ${(WINNING_STREAK_LEVELS as any)[lvl]} games in a row`,
    hasLevels: true,
  },
  [ACHIEVEMENTS.MARATHON_MAN]: {
    title: "Marathon Man",
    type: ACHIEVEMENTS.MARATHON_MAN,
    description: () =>
      `Played a game that lasted more than ${Math.floor(
        MARATHON_MAN_ACHIEVEMENT_TIME / (1000 * 60)
      )} minutes`,
    lockedDescription: () =>
      `Play a game that lasts more than ${Math.floor(
        MARATHON_MAN_ACHIEVEMENT_TIME / (1000 * 60)
      )} minutes`,
  },
  [ACHIEVEMENTS.QUICK_WITTED]: {
    title: "Quick Witted",
    type: ACHIEVEMENTS.QUICK_WITTED,
    description: () =>
      `Won a game in less than ${Math.floor(
        QUICK_WITTED_ACHIEVEMENT_TIME / 1000
      )} seconds`,
    lockedDescription: () =>
      `Win a game in less than ${Math.floor(
        QUICK_WITTED_ACHIEVEMENT_TIME / 1000
      )} seconds`,
  },
  [ACHIEVEMENTS.REVENGE]: {
    title: "Revenge",
    type: ACHIEVEMENTS.REVENGE,
    description: () => "Got revenge after loosing to someone",
    lockedDescription: () => "Get revenge after loosing to someone",
  },
  [ACHIEVEMENTS.ROOKIE_RISER]: {
    title: "Rookie Riser",
    type: ACHIEVEMENTS.ROOKIE_RISER,
    description: (lvl: number) =>
      `Reached a rating of ${(ROOKIE_RISER_LEVELS as any)[lvl]}`,
    lockedDescription: (lvl: number) =>
      `Reach a rating of ${(ROOKIE_RISER_LEVELS as any)[lvl]}`,
    hasLevels: true,
  },
};

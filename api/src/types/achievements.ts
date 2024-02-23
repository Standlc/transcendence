import { Selectable } from 'kysely';
import { Achievement } from './schema';

export type UserAchievement = Selectable<Achievement>;
export type AchievementLevelType = 1 | 2 | 3;

export enum ACHIEVEMENTS {
  FIRST_VICTORY = 1,
  SOCIAL_BUTTERFLY,
  UNDERDOG_VICTORY,
  SHUTOUT,
  WINNING_STREAK,
  VETERAN_PLAYER,
  MARATHON_MAN,
  QUICK_WITTED,
  REVENGE,
  ROOKIE_RISER,
}

export const MARATHON_MAN_ACHIEVEMENT_TIME = 1000 * 60 * 5;
export const QUICK_WITTED_ACHIEVEMENT_TIME = 1000 * 25;

export const SOCIAL_BUTTERFLY_LEVELS: Record<AchievementLevelType, number> = {
  1: 10,
  2: 50,
  3: 500,
};

export const WINNING_STREAK_LEVELS: Record<AchievementLevelType, number> = {
  1: 5,
  2: 20,
  3: 50,
};

export const VETERAN_LEVELS = {
  1: 10,
  2: 100,
  3: 1000,
};

export const ROOKIE_RISER_LEVELS = {
  1: 1000,
  2: 1800,
  3: 2400,
};

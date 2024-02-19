export const GAME_POINTS = [10, 21, 42] as const;

export const BALL_STYLES = [
  "Classic",
  "Basketball",
  "Tennis",
  "Billiards",
  "Soccer",
] as const;

export const BOARD_STYLES = [
  "Classic",
  "Dark",
  "Basketball",
  "Tennis",
  "Billiards",
  "Soccer",
] as const;

export type GAME_POINTS_TYPE = (typeof GAME_POINTS)[number];
export type BOARD_STYLES_TYPE = (typeof BOARD_STYLES)[number];
export type BALL_STYLES_TYPE = (typeof BALL_STYLES)[number];
export type GameSoundEffectsSettingType = {
  volume: number;
  isOn: boolean;
};

export interface GamePreferencesType {
  points: GAME_POINTS_TYPE;
  powerUps: boolean;
  soundEffects: GameSoundEffectsSettingType;
  style: BOARD_STYLES_TYPE;
  ballStyle: BALL_STYLES_TYPE;
}

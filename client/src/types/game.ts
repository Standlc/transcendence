export interface GamePreferencesType {
  points: number;
  powerUps: boolean;
  style: GameStylesType;
}

export type GameStylesType =
  | "classic"
  | "monochrome"
  | "blue"
  | "purple"
  | "rose";

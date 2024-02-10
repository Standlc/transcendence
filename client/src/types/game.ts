export interface GamePreferencesType {
  points: number;
  powerUps: boolean;
  style: GameStylesType;
}

export type GameStylesType =
  | "classic"
  | "green"
  | "monochrome"
  | "blue"
  | "purple"
  | "rose";

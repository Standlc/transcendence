import React from "react";
import { GamePreferencesType } from "../types/game";

export type GameSettingsContextType = {
  gameSettings: GamePreferencesType;
  upadteGameSetting: <T extends keyof GamePreferencesType>(
    field: T,
    value: GamePreferencesType[T]
  ) => void;
};

export const GameSettingsContext = React.createContext(
  undefined as unknown as GameSettingsContextType
);

import { useLayoutEffect, useState } from "react";
import { GamePreferencesType } from "../types/game";

export const useGamePreferences = (): [
  GamePreferencesType,
  React.Dispatch<React.SetStateAction<GamePreferencesType>>
] => {
  const [preferences, setPreferences] = useState<GamePreferencesType>({
    points: 10,
    powerUps: true,
    style: "classic",
  });

  useLayoutEffect(() => {
    const gamePreferences = localStorage.getItem("gamePreferences");
    if (!gamePreferences) {
      localStorage.setItem("gamePreferences", JSON.stringify(preferences));
      return;
    }

    setPreferences(JSON.parse(gamePreferences));
  }, []);

  return [preferences, setPreferences];
};

import { useLayoutEffect, useState } from "react";
import { GAME_POINTS, GamePreferencesType } from "../types/game";
import { GAME_STYLES } from "./game/gameBackgrounds";
import { BALL_STYLES_IMAGES } from "./game/ballStyles";

const typeCheckGameSettings = (obj: any) => {
  if (
    !obj.hasOwnProperty("soundEffects") ||
    typeof obj.soundEffects !== "boolean"
  ) {
    return false;
  }
  if (!obj.hasOwnProperty("powerUps") || typeof obj.powerUps !== "boolean") {
    return false;
  }
  if (
    !obj.hasOwnProperty("points") ||
    !GAME_POINTS.find((n) => n === obj.points)
  ) {
    return false;
  }
  if (!obj.hasOwnProperty("style") || !GAME_STYLES[obj.style as "Classic"]) {
    return false;
  }
  if (
    !obj.hasOwnProperty("ballStyle") ||
    (obj.ballStyle !== "Classic" &&
      !BALL_STYLES_IMAGES[obj.ballStyle as "Classic"])
  ) {
    return false;
  }
  return true;
};

export const useGamePreferences = (): [
  GamePreferencesType,
  <T extends keyof GamePreferencesType>(
    field: T,
    value: GamePreferencesType[T]
  ) => void
] => {
  const [gameSettings, setGameSettings] = useState<GamePreferencesType>({
    soundEffects: true,
    powerUps: false,
    points: 10,
    style: "Classic",
    ballStyle: "Classic",
  });

  useLayoutEffect(() => {
    const gamePreferences = localStorage.getItem("gamePreferences");
    if (!gamePreferences) {
      localStorage.setItem("gamePreferences", JSON.stringify(gameSettings));
      return;
    }

    try {
      const settingsParsed = JSON.parse(gamePreferences);
      if (!typeCheckGameSettings(settingsParsed)) {
        throw new Error("Type checking failed");
      }
      setGameSettings(settingsParsed);
    } catch (error) {
      localStorage.setItem("gamePreferences", JSON.stringify(gameSettings));
    }
  }, []);

  const upadteGameSetting = <T extends keyof GamePreferencesType>(
    field: T,
    value: GamePreferencesType[T]
  ) => {
    gameSettings[field] = value as never;
    setGameSettings({
      ...gameSettings,
    });
    localStorage.setItem("gamePreferences", JSON.stringify(gameSettings));
  };

  return [gameSettings, upadteGameSetting];
};

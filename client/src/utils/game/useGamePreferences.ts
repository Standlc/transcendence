import { useLayoutEffect, useState } from "react";
import { GAME_POINTS, GamePreferencesType } from "../../types/game";
import { GAME_STYLES } from "../../components/gameComponents/gameBackgrounds";
import { BALL_STYLES_IMAGES } from "./ballStyles";

const typeCheckGameSettings = (obj: any) => {
  if (
    !obj.hasOwnProperty("soundEffects") ||
    !obj.soundEffects.hasOwnProperty("isOn") ||
    typeof obj.soundEffects.isOn !== "boolean" ||
    !obj.soundEffects.hasOwnProperty("volume") ||
    typeof obj.soundEffects.volume !== "number" ||
    obj.soundEffects.volume < 0 ||
    obj.soundEffects.volume > 1
  ) {
    return false;
  }
  if (!obj.hasOwnProperty("powerUps") || typeof obj.powerUps !== "boolean") {
    return false;
  }
  if (
    !obj.hasOwnProperty("points") ||
    typeof obj.points !== "number" ||
    !GAME_POINTS.find((n) => n === obj.points)
  ) {
    return false;
  }
  if (
    !obj.hasOwnProperty("style") ||
    typeof obj.style !== "string" ||
    !GAME_STYLES[obj.style as "Classic"]
  ) {
    return false;
  }
  if (
    !obj.hasOwnProperty("ballStyle") ||
    typeof obj.ballStyle !== "string" ||
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
    soundEffects: {
      isOn: true,
      volume: 1,
    },
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

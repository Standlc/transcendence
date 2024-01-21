import { ArrowDropDownRounded, ArrowDropUpRounded } from "@mui/icons-material";
import { GamePreferencesType, GameStylesType } from "../types/game";
import { useContext, useState } from "react";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import { GAME_STYLES } from "../utils/game/gameBackgrounds";
import { PublicGameRequestDto } from "../../../api/src/types/game";

export default function GamePreferences({
  preferences,
  setPreferences,
  setIsSearchingGame,
}: {
  preferences: GamePreferencesType;
  setPreferences: React.Dispatch<React.SetStateAction<GamePreferencesType>>;
  setIsSearchingGame: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const socket = useContext(GameSocketContext);

  const findGame = () => {
    setIsSearchingGame(true);
    socket.emit("publicGameRequest", {
      powerUps: preferences.powerUps,
      nbPoints: preferences.points,
    } satisfies PublicGameRequestDto);
  };

  const updatePreferences = (field: keyof GamePreferencesType, value: any) => {
    preferences[field] = value as never;
    setPreferences({
      ...preferences,
    });
    console.log(preferences);
    localStorage.setItem("gamePreferences", JSON.stringify(preferences));
  };

  return (
    <div className="flex flex-col gap-5 p-5 flex-1 h-min rounded-lg bg-zinc-900 shadow-card-xl">
      <button
        onClick={findGame}
        className="hover:-translate-y-[1px] active:translate-y-0 py-2 px-5 rounded-md bg-indigo-600 font-title font-[900] text-2xl shadow-button"
      >
        Play
      </button>

      <div className="font-title flex flex-col gap-3">
        <DropDownOptions title="Points">
          <div
            aria-selected={preferences.powerUps}
            onClick={() => updatePreferences("powerUps", !preferences.powerUps)}
            className="aria-selected:bg-indigo-600 aria-selected:bg-opacity-10 aria-selected:shadow-[inset_0_0_0_2px_rgb(79,70,229,0.5)] flex hover:bg-white hover:bg-opacity-10 cursor-pointer items-center justify-between rounded-md bg-transparent py-2 px-4 transition-shadow"
          >
            <span>Power ups</span>
          </div>
        </DropDownOptions>

        <DropDownOptions title="Points">
          {[10, 20, 30].map((value) => {
            return (
              <div
                key={value}
                aria-selected={value === preferences.points}
                onClick={() => updatePreferences("points", value)}
                className={`hover:bg-opacity-10 hover:bg-white aria-selected:bg-indigo-600 aria-selected:bg-opacity-10 aria-selected:shadow-[inset_0_0_0_2px_rgb(79,70,229,0.5)] transition-shadow flex cursor-pointer items-center justify-center flex-1 py-2 rounded-lg`}
              >
                {value}
              </div>
            );
          })}
        </DropDownOptions>

        <DropDownOptions title="Background">
          {Object.keys(GAME_STYLES).map((key, i) => {
            return (
              <div
                aria-selected={preferences.style === key}
                key={i}
                onClick={() => updatePreferences("style", key)}
                style={{
                  backgroundColor: GAME_STYLES[key as GameStylesType].bg,
                }}
                className="flex overflow-hidden cursor-pointer before:content-[''] before:w-[50%] before:bg-[rgba(0,0,0,0.2)] aspect-square rounded-lg flex-1 max-w-[40px] transition-shadow aria-selected:shadow-[inset_0_0_0_2px_rgb(79,70,229,0.5)]"
              ></div>
            );
          })}
        </DropDownOptions>

        <DropDownOptions title="Ball">
          {Object.keys(GAME_STYLES).map((key, i) => {
            return (
              <div
                aria-selected={preferences.style === key}
                key={i}
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    style: key as GameStylesType,
                  })
                }
                style={{
                  backgroundColor: GAME_STYLES[key as GameStylesType].bg,
                }}
                className="flex overflow-hidden cursor-pointer before:content-[''] before:w-[50%] before:bg-[rgba(0,0,0,0.2)] aspect-square rounded-lg flex-1 max-w-[40px] transition-shadow aria-selected:shadow-[inset_0_0_0_2px_rgb(79,70,229,0.5)]"
              ></div>
            );
          })}
        </DropDownOptions>
      </div>
    </div>
  );
}

export function DropDownOptions({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  const [isShown, setIsShown] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => setIsShown(!isShown)}
        className="cursor-pointer flex justify-between"
      >
        <span className="font-title font-[900] text-xl">{title}</span>
        {isShown ? <ArrowDropUpRounded /> : <ArrowDropDownRounded />}
      </div>
      <div className="flex gap-2 flex-wrap">{isShown && children}</div>
    </div>
  );
}

import {
  ArrowDropDownRounded,
  ArrowDropUpRounded,
  VolumeUpRounded,
} from "@mui/icons-material";
import { GamePreferencesType, GameStylesType } from "../types/game";
import { PublicGameRequestDto } from "../../../api/src/types/games/gameRequestsDto";
import { useContext, useEffect, useState } from "react";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import { GAME_STYLES } from "../utils/game/gameBackgrounds";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { WsError } from "../../../api/src/types/games/socketPayloadTypes";
import { ErrorContext } from "../ContextsProviders/ErrorContext";

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
  const { setError } = useContext(ErrorContext);

  const findGame = useMutation({
    mutationKey: ["findMatch", preferences],
    mutationFn: async () => {
      setIsSearchingGame(true);
      const payload: PublicGameRequestDto = {
        points: preferences.points,
        powerUps: preferences.powerUps,
      };
      const res = await axios.post<any>("/api/game-requests", payload);
      return res.data;
    },
  });

  const updatePreferences = (field: keyof GamePreferencesType, value: any) => {
    preferences[field] = value as never;
    setPreferences({
      ...preferences,
    });
    console.log(preferences);
    localStorage.setItem("gamePreferences", JSON.stringify(preferences));
  };

  useEffect(() => {
    const handleSocketError = (error: WsError) => {
      setIsSearchingGame(false);
      setError({
        message: "Could not join the game",
      });
    };

    socket.on("error", handleSocketError);
    return () => {
      socket.off("error", handleSocketError);
      socket.emit("cancelGameRequest");
    };
  }, [socket]);

  return (
    <div
      style={
        {
          // backgroundColor: GAME_STYLES[preferences.style].bg,
        }
      }
      className="z-[1] absolute flex items-center justify-center top-0 h-full w-full bg-zinc-900"
    >
      <Setting>
        <VolumeUpRounded />
      </Setting>

      <Setting>10</Setting>
      <Setting>🦄</Setting>
      {/* <button
        onClick={() => findGame.mutate()}
        className="hover:-translate-y-[1px] active:translate-y-0 py-2 px-5 rounded-md bg-indigo-600 font-title font-[900] text-2xl shadow-button"
      >
        Play
      </button> */}
      {/* 
      <div className="font-title flex flex-col gap-3">
        <DropDownOptions title="Gameplay">
          <div
            aria-selected={preferences.powerUps}
            onClick={() => updatePreferences("powerUps", !preferences.powerUps)}
            className="aria-selected:bg-indigo-600 aria-selected:bg-opacity-10 aria-selected:shadow-[inset_0_0_0_2px_rgb(79,70,229,0.5)] flex hover:bg-white hover:bg-opacity-10 cursor-pointer items-center justify-between rounded-md bg-transparent py-2 px-4 transition-shadow"
          >
            <span>Power ups</span>
          </div>
        </DropDownOptions>

        <DropDownOptions title="Points">
          {[3, 20, 1000].map((value) => {
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
      </div> */}
    </div>
  );
}

const Setting = ({ children }: { children: any }) => {
  return (
    <div className="flex cursor-pointer items-center rounded-md justify-center w-[35px] h-[35px] hover:bg-indigo-600">
      {children}
    </div>
  );
};

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

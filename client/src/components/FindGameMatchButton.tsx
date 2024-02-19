import { useContext } from "react";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import { useFindGameMatch } from "../utils/requests/useFindGameMatch";

export const FindGameMatchButton = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const { gameSettings } = useContext(GameSettingsContext);
  const { findGame, cancel, isFindingGame } = useFindGameMatch({
    points: gameSettings.points,
    powerUps: gameSettings.powerUps,
  });

  return (
    <button
      onClick={() => {
        !isFindingGame ? findGame.mutate() : cancel.mutate();
      }}
      className="hover:-translate-y-[1px] flex items-center py-4 px-5 justify-center overflow-hidden active:translate-y-0 rounded-lg bg-indigo-500 font-[900] text-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.6)]"
    >
      {!isFindingGame ? (
        children
      ) : (
        <div className="flex flex-col gap-1 items-center">
          <span className="">Finding a game</span>
          <div className="h-[3px] w-[100%] overflow-hidden flex justify-center">
            <div className="h-full w-[70%] animate-move-left-right bg-white opacity-50"></div>
          </div>
        </div>
      )}
    </button>
  );
};

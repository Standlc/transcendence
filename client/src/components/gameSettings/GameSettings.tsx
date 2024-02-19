import { Tune } from "@mui/icons-material";
import { BALL_STYLES, BOARD_STYLES, GAME_POINTS } from "../../types/game";
import { useContext } from "react";
import { GameSettingsContext } from "../../ContextsProviders/GameSettingsContext";
import { VolumeKnob } from "./VolumeKnob";

export default function GamePreferences({ hide }: { hide: () => void }) {
  const { gameSettings, upadteGameSetting } = useContext(GameSettingsContext);

  return (
    <div className="flex max-h-full flex-col gap-5 flex-[2] p-5 bg-white bg-opacity-5 rounded-lg min-w-80">
      <div className="font-[900] text-2xl flex items-center gap-2">
        <Tune />
        <span>Game Settings</span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm opacity-50 font-extrabold">
          MATCHING PREFERENCES
        </span>
        <Setting
          title="Power Ups"
          onClick={() => {
            upadteGameSetting("powerUps", !gameSettings.powerUps);
          }}
        >
          <div
            aria-selected={gameSettings.powerUps}
            className="aria-selected:text-green-500 text-red-500"
          >
            {gameSettings.powerUps ? "On" : "Off"}
          </div>
        </Setting>
        <Setting
          title="Points"
          onClick={() => {
            const index = GAME_POINTS.indexOf(gameSettings.points);
            const nextIndex = index + 1 >= GAME_POINTS.length ? 0 : index + 1;
            upadteGameSetting("points", GAME_POINTS[nextIndex]);
          }}
        >
          {gameSettings.points}
        </Setting>
        <span className="text-sm opacity-50 font-extrabold mt-2">STYLE</span>
        <Setting
          title="Board"
          onClick={() => {
            const index = BOARD_STYLES.indexOf(gameSettings.style);
            const nextIndex = index + 1 >= BOARD_STYLES.length ? 0 : index + 1;
            upadteGameSetting("style", BOARD_STYLES[nextIndex]);
          }}
        >
          {gameSettings.style}
        </Setting>
        <Setting
          title="Ball"
          onClick={() => {
            const index = BALL_STYLES.indexOf(gameSettings.ballStyle);
            const nextIndex = index + 1 >= BALL_STYLES.length ? 0 : index + 1;
            upadteGameSetting("ballStyle", BALL_STYLES[nextIndex]);
          }}
        >
          {gameSettings.ballStyle}
        </Setting>

        <span className="text-sm opacity-50 font-extrabold mt-2">SOUND</span>
        <VolumeKnob soundEffectsSetting={gameSettings.soundEffects} />
      </div>

      <button
        onClick={hide}
        className="bg-white bg-opacity-0 rounded-md opacity-50 hover:opacity-100 font-extrabold self-end justify-self-end mt-auto"
      >
        Done
      </button>
    </div>
  );
}

const Setting = ({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: any;
}) => {
  return (
    <div
      onClick={onClick}
      className="flex select-none justify-between cursor-pointer items-center rounded-md hover:bg-opacity-15 active:translate-y-[1px] p-5 shadow-inset bg-white bg-opacity-5"
    >
      <span className="font-extrabold">{title}</span>
      <div className="font-extrabold">{children}</div>
    </div>
  );
};

// const OnOffSwitch = ({ isOn }: { isOn: boolean }) => {
//   return (
//     <div className="flex text-sm font-[700] items-center">
//       <div
//         aria-selected={!isOn}
//         className="px-[5px] bg-red-500 aria-selected:opacity-100 opacity-10"
//       >
//         Off
//       </div>
//       <div
//         // aria-selected={isOn}
//         className="px-[5px] bg-indigo-600 aria-selected:opacity-100 opacity-100"
//       >
//         On
//       </div>
//     </div>
//   );
// };

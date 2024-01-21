import { useContext } from "react";
import { GameStateType, PlayerType } from "../../../api/src/types/game";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";
import GameCanvas from "./GameCanvas";
import { UserContext } from "../ContextsProviders/UserContext";
import { GamePreferencesType } from "../types/game";
import { GAME_STYLES } from "../utils/game/gameBackgrounds";
import { useGamePlayers } from "../utils/game/useGetGamePlayers";

export default function GameLayout({
  game,
  preferences,
}: {
  game: GameStateType;
  preferences: GamePreferencesType;
}) {
  const { user } = useContext(UserContext);
  const { playerLeft, playerRight } = useGamePlayers(game);

  return (
    <div
      id="canvas-layout"
      style={{
        backgroundColor: GAME_STYLES[preferences.style].bg,
      }}
      className="self-center max-h-full max-w-full overflow-hidden relative bg-opacity-100 rounded-lg shadow-card-xl"
    >
      <GameScores playerLeft={playerLeft} playerRight={playerRight} />
      <div
        className="relative h-full w-full flex items-center justify-center"
        style={{
          transform:
            game.playerRight.userId !== user.id ? "scaleX(-1)" : "unset",
        }}
      >
        <GameCanvas game={game} />
        <div className="-z-10 absolute h-[100%] aspect-square rounded-full bg-black opacity-20 left-0 -translate-x-[80%]"></div>
        <div className="-z-10 absolute h-[40%] aspect-square rounded-full bg-black opacity-20 "></div>
        <div className="-z-10 absolute h-[100%] aspect-square rounded-full bg-black opacity-20 right-0 translate-x-[80%]"></div>
      </div>
      {/* <div className="absolute top-0 left-0 w-full bg-indigo-600 h-[3px]"></div>
      <div className="absolute bottom-0 bottom-0-0 w-full bg-indigo-600 h-[3px]"></div> */}
    </div>
  );
}

function GameScores({
  playerRight,
  playerLeft,
}: {
  playerRight: PlayerType;
  playerLeft: PlayerType;
}) {
  return (
    <div className="absolute h-full w-full flex">
      <div className="absolute w-full flex justify-around mt-[10%] items-center font-gameFont text-clamp">
        <InfiniteSlotMachine state={playerLeft.score} />
        <InfiniteSlotMachine state={playerRight.score} />
      </div>
    </div>
  );
}

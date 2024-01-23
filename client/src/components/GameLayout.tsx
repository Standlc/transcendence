import { useContext } from "react";
import { GameStateType, PlayerType } from "../../../api/src/types/game";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";
import GameCanvas from "./GameCanvas";
import { UserContext } from "../contextsProviders/UserContext";
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
  const players = useGamePlayers(game);

  return (
    <div
      id="canvas-layout"
      style={{
        backgroundColor: GAME_STYLES[preferences.style].bg,
      }}
      className="self-center max-h-full max-w-full overflow-hidden relative bg-opacity-100 rounded-lg shadow-card-xl"
    >
      {players && <GameScores players={players} />}
      <div
        className="relative h-full w-full flex items-center justify-center z-0"
        style={{
          transform: game.playerRight.id !== user.id ? "scaleX(-1)" : "unset",
        }}
      >
        <GameCanvas game={game} />
        <div className="-z-10 absolute h-[100%] aspect-square rounded-full bg-black opacity-20 left-0 -translate-x-[80%]"></div>
        <div className="-z-10 absolute h-[40%] aspect-square rounded-full bg-black opacity-20 "></div>
        <div className="-z-10 absolute h-[100%] aspect-square rounded-full bg-black opacity-20 right-0 translate-x-[80%]"></div>
      </div>
    </div>
  );
}

function GameScores({
  players,
}: {
  players: { left: PlayerType; right: PlayerType };
}) {
  return (
    <div className="absolute h-full w-full flex">
      <div className="absolute w-full flex justify-around mt-[10%] items-center font-gameFont text-clamp">
        <InfiniteSlotMachine state={players.left.score} />
        <InfiniteSlotMachine state={players.right.score} />
      </div>
    </div>
  );
}

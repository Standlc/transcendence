import { memo, useContext, useMemo } from "react";
import InfiniteSlotMachine from "../../UIKit/InfiniteSlotMachine";
import { UserContext } from "../../ContextsProviders/UserContext";
import { GamePreferencesType } from "../../types/game";
import { GAME_STYLES } from "../../utils/game/gameBackgrounds";
import { GameStateType } from "../../../../api/src/types/games/pongGameTypes";

export default function GameLayout({
  game,
  preferences,
  children,
}: {
  game: GameStateType;
  preferences: GamePreferencesType;
  children: any;
}) {
  const { user } = useContext(UserContext);
  const reverse = useMemo(
    () => user.id === game.playerOne.id,
    [user.id, game.playerOne.id]
  );

  return (
    <div>
      <div
        id="canvas-layout"
        style={{
          backgroundColor: GAME_STYLES[preferences.style].bg,
          flexDirection: reverse ? "row-reverse" : "unset",
        }}
        className="self-center max-h-full relative bg-opacity-100 border-[5px] border-[rgba(255,255,255,0.1)] rounded-2xl max-w-[700px] shadow-[0_8px_0_rgb(25,25,25)]"
      >
        <GameScores
          playerOneScore={game.playerOne.score}
          playerTwoScore={game.playerTwo.score}
        />
        <div
          className="relative h-full w-full flex items-center justify-center z-0"
          style={{
            transform: reverse ? "scaleX(-1)" : "unset",
          }}
        >
          {children}

          <div className="-z-10 absolute h-full w-full overflow-hidden flex items-center justify-center">
            <div className="-z-10 absolute h-[100%] aspect-square rounded-full bg-black opacity-10 left-0 -translate-x-[80%]"></div>
            <div className="-z-10 absolute h-[40%] aspect-square rounded-full bg-black opacity-10 "></div>
            <div className="-z-10 absolute h-[100%] aspect-square rounded-full bg-black opacity-10 right-0 translate-x-[80%]"></div>
          </div>
        </div>
      </div>
      <TableLegs />
    </div>
  );
}

const TableLegs = memo(() => {
  return (
    <div className="relative bottom-0 w-full h-[60px] flex justify-center items-center -z-10">
      <div className="bg-[rgb(20,20,20)] h-full w-[15px]"></div>
      <div className="bg-[rgb(20,20,20)] h-[8px] w-[75%]"></div>
      <div className="bg-[rgb(20,20,20)] h-full w-[15px]"></div>
    </div>
  );
});

const GameScores = memo(
  ({
    playerOneScore,
    playerTwoScore,
  }: {
    playerOneScore: number;
    playerTwoScore: number;
  }) => {
    return (
      <div className="absolute h-full w-full flex [flex-direction:inherit]">
        <div className="absolute w-full flex justify-around mt-[10%] items-center font-gameFont text-clamp [flex-direction:inherit]">
          <InfiniteSlotMachine state={playerOneScore} />
          <InfiniteSlotMachine state={playerTwoScore} />
        </div>
      </div>
    );
  }
);

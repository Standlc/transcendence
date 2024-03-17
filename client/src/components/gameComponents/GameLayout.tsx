import { memo, useContext, useMemo } from "react";
import { UserContext } from "../../ContextsProviders/UserContext";
import { GAME_STYLES } from "./gameBackgrounds";
import { UserGame } from "@api/types/games";
import { Avatar } from "../../UIKit/avatar/Avatar";
import InfiniteSlotMachine from "../../UIKit/InfiniteSlotMachine";
import { GameSettingsContext } from "../../ContextsProviders/GameSettingsContext";
import { VolumeOffRounded, VolumeUpRounded } from "@mui/icons-material";
import { PlayerRating } from "../../UIKit/PlayerRating";

const GameLayout = memo(
  ({
    gameRecord,
    children,
    playersPingRtt,
    isDisconnected,
  }: {
    gameRecord?: UserGame | undefined;
    playersPingRtt?: number[];
    children: any;
    isDisconnected?: boolean;
  }) => {
    const { user } = useContext(UserContext);
    const { gameSettings, upadteGameSetting } = useContext(GameSettingsContext);
    const reverse = useMemo(
      () => gameRecord !== undefined && user.id === gameRecord.playerOne?.id,
      [user.id, gameRecord?.playerOne?.id]
    );

    return (
      <div className="flex flex-col gap-5 justify-center items-center max-h-[90vh] max-w-[100vw] min-w-80">
        <div
          style={{
            opacity: isDisconnected ? "0.5" : "1",
          }}
          className="relative flex flex-col gap-5 justify-center items-center transition-opacity max-h-full max-w-full pb-[70px]"
        >
          {gameRecord && playersPingRtt && (
            <PlayersInfos
              gameRecord={gameRecord}
              playersPingRtt={playersPingRtt}
            />
          )}

          <div
            style={{
              backgroundColor: GAME_STYLES[gameSettings.style].primary,
              flexDirection: reverse ? "row-reverse" : "unset",
            }}
            className="self-center relative border-[5px] border-[rgba(255,255,255,0.2)] shadow-[0_10px_0_rgb(28,28,28)] [transfor:perspective(100px)_rotateX(1deg)] origin-bottom flex items-center justify-center max-h-full max-w-full aspect-[800/700]"
          >
            {gameRecord && <GameScores gameRecord={gameRecord} />}

            <div
              className="relative flex items-center justify-center max-h-full max-w-full"
              style={{
                transform: reverse ? "scaleX(-1)" : "unset",
              }}
            >
              {GAME_STYLES[gameSettings.style].court}
              {children}
            </div>

            <button
              onClick={() => {
                upadteGameSetting("soundEffects", {
                  ...gameSettings.soundEffects,
                  isOn: !gameSettings.soundEffects.isOn,
                });
              }}
              className="absolute z-[2] bottom-3 right-3 p-1 flex before:absolute before:top-0 before:left-0 before:content-[''] before:h-[100%] before:w-[100%] before:rounded-full before:bg-white before:opacity-20 opacity-50 hover:opacity-100"
            >
              {gameSettings.soundEffects.isOn ? (
                <VolumeUpRounded fontSize="small" />
              ) : (
                <VolumeOffRounded fontSize="small" />
              )}
            </button>
          </div>

          <TableLegs />
        </div>
      </div>
    );
  }
);

export default GameLayout;

const TableLegs = memo(() => {
  return (
    <div className="absolute bottom-0 w-full min-h-[70px] h-[70px] flex justify-center items-center -z-10">
      <div className="bg-[rgb(20,20,20)] h-full w-[15px]"></div>
      <div className="bg-[rgb(20,20,20)] h-[8px] w-[75%]"></div>
      <div className="bg-[rgb(20,20,20)] h-full w-[15px]"></div>
    </div>
  );
});

const GameScores = memo(({ gameRecord }: { gameRecord: UserGame }) => {
  return (
    <div className="z-[1] absolute top-0 h-full w-full flex [flex-direction:inherit]">
      <div className="absolute w-full flex justify-around mt-[10%] items-center font-gameFont text-clamp [flex-direction:inherit]">
        <InfiniteSlotMachine state={gameRecord.playerOne.score} />
        <InfiniteSlotMachine state={gameRecord.playerTwo.score} />
      </div>
    </div>
  );
});

const PlayersInfos = memo(
  ({
    gameRecord,
    playersPingRtt,
  }: {
    gameRecord: UserGame;
    playersPingRtt: number[];
  }) => {
    const { user } = useContext(UserContext);
    const reverse = useMemo(
      () => user.id === gameRecord.playerOne.id,
      [user.id, gameRecord.playerOne.id]
    );

    return (
      <div
        style={{
          flexDirection: reverse ? "row-reverse" : "unset",
        }}
        className="absolute top-0 w-full font-extrabold flex justify-between items-end z-[1] translate-y-[calc(-100%-1.25rem)]"
      >
        <div className="flex items-end gap-3 [flex-direction:inherit]">
          <div>
            <Avatar
              size="md"
              imgUrl={gameRecord.playerOne.avatarUrl}
              userId={gameRecord.playerOne.id}
            />
          </div>
          <div className="flex items-center flex-wrap gap-2 [flex-direction:inherit]">
            <span className="text-lg leading-none">
              {gameRecord.playerOne.username}
            </span>
            <PlayerRating rating={gameRecord.playerOne.rating} />
            <ConnectionStatus pingRtt={playersPingRtt[0]} />
          </div>
        </div>

        <div
          style={{
            flexDirection: !reverse ? "row-reverse" : "unset",
          }}
          className="flex items-end gap-3"
        >
          <div>
            <Avatar
              size="md"
              imgUrl={gameRecord.playerTwo.avatarUrl}
              userId={gameRecord.playerTwo.id}
            />
          </div>
          <div className="flex items-center flex-wrap-reverse gap-2 justify-end [flex-direction:inherit]">
            <span className="text-lg leading-none">
              {gameRecord.playerTwo.username}
            </span>
            <PlayerRating rating={gameRecord.playerTwo.rating} />
            <ConnectionStatus pingRtt={playersPingRtt[1]} />
          </div>
        </div>
      </div>
    );
  }
);

const CONNECTION_BARS = 4;

const ConnectionDescriptions = [
  "Very low lag",
  "Low lag",
  "Moderate lag",
  "High lag",
  "Very high lag",
];

const ConnectionStatus = memo(({ pingRtt }: { pingRtt: number }) => {
  const normalized = useMemo(() => {
    const normalized = 1 - (pingRtt > 100 ? 100 : pingRtt) / 100;
    const connectionQuality = Math.round(normalized * CONNECTION_BARS);
    return connectionQuality;
  }, [pingRtt]);

  return (
    <div className="relative flex justify-center peer [flex-direction:inherit]">
      <div className="min-h-[20px] flex gap-[2px] [flex-direction:inherit] peer/connection cursor-pointer py-[5px]">
        {Array(CONNECTION_BARS)
          .fill(0)
          .map((_, i) =>
            !normalized && !i ? (
              <div
                key={i}
                className="h-full w-[4px] bg-red-500 rounded-[2px]"
              ></div>
            ) : i < normalized ? (
              <div
                key={i}
                className="h-full w-[4px] bg-green-500 opacity-70 rounded-[2px]"
              ></div>
            ) : (
              <div
                key={i}
                className="h-full w-[4px] bg-white opacity-10 rounded-[2px]"
              ></div>
            )
          )}
      </div>
      <div className="z-[2] cursor-none whitespace-nowrap absolute -top-1 translate-y-[-100%] bg-zinc-950 text-xs font-[500] rounded-md px-2 py-1 opacity-0 [visibility:hidden] peer-hover/connection:opacity-100 scale-90 peer-hover/connection:scale-100 peer-hover/connection:[visibility:visible] origin-bottom transition-all [transition-timing-function:cubic-bezier(0.7,0,0,1.4)]">
        {ConnectionDescriptions.at(CONNECTION_BARS - normalized)}
      </div>
    </div>
  );
});

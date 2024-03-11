import { Avatar } from "../UIKit/avatar/Avatar";
import { memo, useContext, useMemo } from "react";
import { EmojiEvents } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { GamePlayer, UserGame } from "@api/types/games";
import { UserContext } from "../ContextsProviders/UserContext";

export const GameFinishedCard = memo(
  ({
    game,
    showSettings,
    PlayButton,
  }: {
    game: UserGame;
    showSettings: () => void;
    PlayButton: () => JSX.Element;
  }) => {
    const { user } = useContext(UserContext);

    const { playerOne, playerTwo } = game;
    const winner = useMemo(
      () => (playerOne.id === game.winnerId ? playerOne : playerTwo),
      [game.winnerId, playerOne.id]
    );

    const { playerLeft, playerRight } = useMemo(() => {
      if (user.id === playerOne.id) {
        return {
          playerLeft: playerTwo,
          playerRight: playerOne,
        };
      }
      return {
        playerLeft: playerOne,
        playerRight: playerTwo,
      };
    }, [user.id, playerOne.id]);

    return (
      <div className="flex flex-col w-full justify-center gap-7 p-5">
        <span className="font-[900] text-center text-2xl">
          {winner.username} won!
        </span>

        <div className="flex flex-col gap-5 justify-center">
          <PlayerQuickInfos player={playerLeft} winnerId={winner.id} />

          <span className="flex absolute items-center gap-2 self-center font-gameFont text-xl">
            <span>{playerLeft.score}</span>
            <span className="text-xs">-</span>
            <span>{playerRight.score}</span>
          </span>

          <PlayerQuickInfos
            player={playerRight}
            winnerId={winner.id}
            style={{
              flexDirection: "row-reverse",
              alignItems: "end",
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <PlayButton />

          <div className="flex gap-2 w-full">
            <Link
              to={"/play"}
              className="bg-white flex-1 text-center bg-opacity-5 hover:bg-opacity-10 rounded-md py-2 text-base active:translate-y-[1px]"
            >
              Leave
            </Link>
            <button
              onClick={showSettings}
              className="bg-white flex-1 text-center bg-opacity-5 hover:bg-opacity-10 rounded-md py-2 text-base active:translate-y-[1px]"
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export const PlayerQuickInfos = ({
  player,
  winnerId,
  style,
  isDisconnected,
}: {
  player: GamePlayer;
  winnerId: number;
  style?: React.CSSProperties;
  isDisconnected?: boolean;
}) => {
  const ratingChange = player.ratingChange ?? 0;
  return (
    <div
      style={{ ...style, opacity: isDisconnected ? 0.3 : 1 }}
      className="flex font-extrabold items-start gap-3 flex-1"
    >
      <PlayerAvatar player={player} winnerId={winnerId} />
      <div className="flex gap-3 [flex-direction:inherit] items-center">
        <span className="text-lg">{player.username}</span>
        <div className="text-sm flex items-center text-indigo-400 rounded-md px-2 py-[2px] bg-indigo-500 bg-opacity-20">
          {player.rating}
          {ratingChange > 0 ? (
            <span className="text-[12px] text-green-500 ml-1 opacity-100">
              +{player.ratingChange}
            </span>
          ) : ratingChange < 0 ? (
            <span className="text-[12px] text-red-500 ml-1 opacity-100">
              {player.ratingChange}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const PlayerAvatar = ({
  player,
  winnerId,
}: {
  player: GamePlayer;
  winnerId: number;
}) => {
  const isWinner = winnerId === player.id;

  return (
    <div
      style={{
        borderStyle: !isWinner ? "hidden" : "solid",
      }}
      className="relative border-[5px] overflow-hidden rounded-2xl border-indigo-500"
    >
      <div style={{ margin: isWinner ? "-5px" : "" }} className="relative">
        <Avatar imgUrl={undefined} size="lg" userId={player.id} />
      </div>
      {isWinner && (
        <div className="absolute -bottom-[5px] -right-[5px] rounded-tl-md bg-indigo-500 text-yellow-400 h-[25px] w-[25px] flex items-center justify-center">
          <EmojiEvents style={{ fontSize: 16 }} />
        </div>
      )}
    </div>
  );
};

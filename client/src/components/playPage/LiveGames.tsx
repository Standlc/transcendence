import { useContext, useEffect } from "react";
import { SocketsContext } from "../../ContextsProviders/SocketsContext";
import { UserGame } from "@api/types/games";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  WsGameIdType,
  WsLiveGameUpdate,
} from "@api//types/gameServer/socketPayloadTypes";
import InfiniteSlotMachine from "../../UIKit/InfiniteSlotMachine";
import { EmojiEvents } from "@mui/icons-material";
import { PlayerRating } from "../../UIKit/PlayerRating";

export default function LiveGames() {
  const { gameSocketOn, gameSocketOff } = useContext(SocketsContext);
  const queryClient = useQueryClient();

  const liveGames = useQuery({
    queryFn: async () => {
      const res = await axios.get<UserGame[]>("/api/games/live");
      return res.data;
    },
    queryKey: ["liveGames"],
  });

  const newLiveGame = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await axios.get<UserGame>(`/api/games/${gameId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["liveGames"], (prev: (typeof data)[]) =>
        prev ? [data, ...prev] : data
      );
    },
    mutationKey: ["newLiveGame"],
  });

  useEffect(() => {
    const handleNewLiveGame = (data: WsGameIdType) => {
      newLiveGame.mutate(data.gameId);
    };

    const handleGameUpdate = (data: WsLiveGameUpdate) => {
      queryClient.setQueryData(
        ["liveGames"],
        (prev: UserGame[] | undefined) => {
          if (!prev) return undefined;

          return prev.map((game) => {
            if (game.id === data.gameId) {
              let playerOneScore = 0;
              let playerTwoScore = 0;
              if (game.playerOne) {
                const playerOne = data.players.find(
                  (p) => p.id === game.playerOne?.id
                );
                playerOneScore = playerOne?.score ?? 0;
              }
              if (game.playerTwo) {
                const playerTwo = data.players.find(
                  (p) => p.id === game.playerTwo?.id
                );
                playerTwoScore = playerTwo?.score ?? 0;
              }
              return {
                ...game,
                playerOne: { ...game.playerOne, score: playerOneScore },
                playerTwo: { ...game.playerTwo, score: playerTwoScore },
              };
            }
            return game;
          });
        }
      );
    };

    const handleLiveGameEnd = (gameId: number) => {
      queryClient.setQueryData(["liveGames"], (prev: UserGame[]) =>
        prev ? prev.filter((game) => game.id !== gameId) : prev
      );
    };

    gameSocketOn("liveGame", handleNewLiveGame);
    gameSocketOn("liveGameUpdate", handleGameUpdate);
    gameSocketOn("liveGameEnd", handleLiveGameEnd);
    return () => {
      gameSocketOff("liveGame", handleNewLiveGame);
      gameSocketOff("liveGameUpdate", handleGameUpdate);
      gameSocketOff("liveGameEnd", handleLiveGameEnd);
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-5">
      {!liveGames.data?.length ? (
        <span className="opacity-50 text-lg">No games going on right now</span>
      ) : (
        <div className="flex flex-col gap-[2px]">
          {liveGames.data.map((game, i) => {
            return <GameInfo key={i} game={game} />;
          })}
        </div>
      )}
    </div>
  );
}

export const GameInfo = ({ game }: { game: UserGame }) => {
  const { playerOne, playerTwo } = game;
  const navigate = useNavigate();

  const ongoingGameStyle = "hover:bg-white hover:bg-opacity-10 cursor-pointer";

  return (
    <div
      onClick={() => !game.winnerId && navigate(`/play/game/${game.id}`)}
      className={`relative flex items-center justify-center odd:bg-white rounded-md odd:bg-opacity-5 ${
        !game.winnerId && ongoingGameStyle
      }`}
    >
      <span className="text-sm absolute font-gameFont">-</span>
      <div className="w-full grid grid-cols-2 gap-7 font-extrabold justify-around p-3">
        <div className="flex items-center gap-3 flex-1">
          <PlayerAvatar
            playerId={game.playerOne.id}
            winnerId={game.winnerId ?? 0}
          />
          <span className="text-base">{playerOne?.username ?? "Unkown"}</span>
          <PlayerRating rating={playerOne.rating}>
            {playerOne.ratingChange > 0 ? (
              <span className="text-[12px] text-green-500 ml-1 opacity-100">
                +{playerOne.ratingChange}
              </span>
            ) : playerOne.ratingChange < 0 ? (
              <span className="text-[12px] text-red-500 ml-1 opacity-100">
                {playerOne.ratingChange}
              </span>
            ) : null}
          </PlayerRating>

          <div className="text-lg font-gameFont justify-self-end flex-1 flex justify-end">
            <InfiniteSlotMachine state={playerOne?.score ?? 0} />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-lg font-gameFont flex-1 flex justify-start">
            <InfiniteSlotMachine state={playerTwo?.score ?? 0} />
          </div>

          <PlayerRating rating={playerTwo.rating}>
            {playerTwo.ratingChange > 0 ? (
              <span className="text-[12px] text-green-500 ml-1 opacity-100">
                +{playerTwo.ratingChange}
              </span>
            ) : playerTwo.ratingChange < 0 ? (
              <span className="text-[12px] text-red-500 ml-1 opacity-100">
                {playerTwo.ratingChange}
              </span>
            ) : null}
          </PlayerRating>
          <span className="text-base">{playerTwo?.username ?? "Unkown"}</span>
          <PlayerAvatar
            playerId={game.playerTwo.id}
            winnerId={game.winnerId ?? 0}
          />
        </div>
      </div>
    </div>
  );
};

const PlayerAvatar = ({
  playerId,
  winnerId,
}: {
  playerId: number;
  winnerId: number;
}) => {
  const isWinner = winnerId === playerId;

  return (
    <div
      style={{
        borderStyle: !isWinner ? "hidden" : "solid",
      }}
      className="relative border-[3px] overflow-hidden rounded-xl border-indigo-600"
    >
      <div style={{ margin: isWinner ? "-3px" : "" }} className="relative">
        <Avatar imgUrl={undefined} size={"md"} userId={playerId} />
      </div>
      {isWinner && (
        <div className="absolute -bottom-[3px] -right-[3px] rounded-tl-md bg-indigo-600 text-yellow-400 h-[20px] w-[20px] flex items-center justify-center">
          <EmojiEvents style={{ fontSize: 13 }} />
        </div>
      )}
    </div>
  );
};

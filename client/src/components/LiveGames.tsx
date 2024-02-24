import { useContext, useEffect } from "react";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { AppGame } from "../../../api/src/types/games/returnTypes";
import { Avatar } from "../UIKit/avatar/Avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  WsGameIdType,
  WsLiveGameUpdate,
} from "../../../api/src/types/games/socketPayloadTypes";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";

export default function LiveGames() {
  const { gameSocket } = useContext(SocketsContext);
  const queryClient = useQueryClient();

  const liveGames = useQuery({
    queryFn: async () => {
      const res = await axios.get<AppGame[]>("/api/games/live");
      return res.data;
    },
    queryKey: ["liveGames"],
  });

  const newLiveGame = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await axios.get<AppGame>(`/api/games/${gameId}`);
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
      queryClient.setQueryData(["liveGames"], (prev: AppGame[] | undefined) => {
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
      });
    };

    const handleLiveGameEnd = (gameId: number) => {
      queryClient.setQueryData(["liveGames"], (prev: AppGame[]) =>
        prev ? prev.filter((game) => game.id !== gameId) : prev
      );
    };

    gameSocket.on("liveGame", handleNewLiveGame);
    gameSocket.on("liveGameUpdate", handleGameUpdate);
    gameSocket.on("liveGameEnd", handleLiveGameEnd);
    return () => {
      gameSocket.off("liveGame", handleNewLiveGame);
      gameSocket.off("liveGameUpdate", handleGameUpdate);
      gameSocket.off("liveGameEnd", handleLiveGameEnd);
    };
  }, [gameSocket]);

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

export const GameInfo = ({ game }: { game: AppGame }) => {
  const { playerOne, playerTwo } = game;
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/play/${game.id}`)}
      className="flex items-center font-extrabold odd:bg-white odd:bg-opacity-5 gap-3 justify-around px-5 py-3 hover:bg-white hover:bg-opacity-10 cursor-pointer rounded-md"
    >
      <div className="flex items-center gap-3 flex-1">
        <Avatar imgUrl={undefined} size="md" userId={playerOne?.id ?? 0} />
        <span className="text-base">{playerOne?.username ?? "Unkown"}</span>
        <div className="text-sm text-indigo-400 rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
          {playerOne?.rating ?? "Unkown"}
        </div>

        <div className="text-lg font-gameFont justify-self-end flex-1 flex justify-end">
          <InfiniteSlotMachine state={playerOne?.score ?? 0} />
        </div>
      </div>

      <span className="text-sm">-</span>

      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="text-lg font-gameFont flex-1 flex justify-start">
          <InfiniteSlotMachine state={playerTwo?.score ?? 0} />
        </div>

        <div className="text-sm text-indigo-400 rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
          {playerTwo?.rating ?? "Unkown"}
        </div>
        <span className="text-base">{playerTwo?.username ?? "Unkown"}</span>
      </div>
      <Avatar imgUrl={undefined} size="md" userId={playerTwo?.id ?? 0} />
    </div>
  );
};

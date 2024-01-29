import { useContext, useEffect } from "react";
import { GameSocketContext } from "../contextsProviders/GameSocketContext";
import { AppGame } from "../../../api/src/types/games/returnTypes";
import { Avatar } from "../UIKit/Avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  WsGameIdType,
  WsLiveGameUpdate,
} from "../../../api/src/types/games/socketPayloadTypes";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";

export default function LiveGames() {
  const socket = useContext(GameSocketContext);
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
        prev ? [...prev, data] : data
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

    socket.on("liveGame", handleNewLiveGame);
    socket.on("liveGameUpdate", handleGameUpdate);
    socket.on("liveGameEnd", handleLiveGameEnd);
    return () => {
      socket.off("liveGame", handleNewLiveGame);
      socket.off("liveGameUpdate", handleGameUpdate);
      socket.off("liveGameEnd", handleLiveGameEnd);
    };
  }, [socket]);

  return (
    <div className="w-full flex flex-col gap-5">
      {liveGames.data?.length === 0 ? (
        <span className="font-[700] opacity-50 text-xl">
          No games going on right now
        </span>
      ) : (
        <div className="flex flex-col gap-[2px]">
          {liveGames.data?.map((game, i) => {
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
      className="flex items-center odd:bg-white odd:bg-opacity-5 gap-3 justify-around px-5 py-3 hover:bg-white hover:bg-opacity-10 cursor-pointer rounded-md"
    >
      <div className="flex items-center gap-3 flex-1">
        <Avatar imgUrl={undefined} size="md" userId={playerOne?.id ?? 0} />
        <div className="flex items-center gap-2">
          <span className="text-base font-title font-bold">
            {playerOne?.username ?? "Unkown"}
          </span>
          <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
            {playerOne?.rating ?? "Unkown"}
          </div>
        </div>

        <div className="font-gameFont text-lg justify-self-end flex-1 flex justify-end">
          <InfiniteSlotMachine state={playerOne?.score ?? 0} />
        </div>
      </div>

      <span className="font-gameFont text-sm">-</span>

      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="font-gameFont text-lg flex-1 flex justify-start">
          <InfiniteSlotMachine state={playerTwo?.score ?? 0} />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
            {playerTwo?.rating ?? "Unkown"}
          </div>
          <span className="text-base font-title font-bold">
            {playerTwo?.username ?? "Unkown"}
          </span>
        </div>
        <Avatar imgUrl={undefined} size="md" userId={playerTwo?.id ?? 0} />
      </div>
    </div>
  );
};

import { useContext, useEffect } from "react";
import { Avatar } from "../UIKit/Avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { LeaderbordPlayer } from "../../../api/src/types/games/games";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import {
  Tuple,
  WsLeaderboardPlayerUpdate,
} from "../../../api/src/types/games/socketPayloadTypes";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";

export default function Leaderboard({ limit }: { limit?: number }) {
  const socket = useContext(GameSocketContext);
  const queryClient = useQueryClient();

  const leaderboard = useQuery({
    queryFn: async () => {
      const res = await axios.get<LeaderbordPlayer[]>(
        `/api/players/leaderboard${limit ? `?limit=${limit}` : ""}`
      );
      return res.data;
    },
    queryKey: ["leaderboard"],
  });

  const newLeaderboardPlayers = useMutation({
    mutationFn: async (userIds: number[]) => {
      console.log("fetching player info");
      const res = await axios.post<LeaderbordPlayer[]>(
        `/api/players/leaderboard`,
        userIds
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["leaderboard"], (prev: LeaderbordPlayer[]) => {
        console.log("api data", data);
        if (!prev) return data;
        const newLeaderboard = [...prev, ...data];
        newLeaderboard.sort((a, b) => b.rating - a.rating);
        if (limit) return newLeaderboard.splice(0, limit);
        return newLeaderboard;
      });
    },
    mutationKey: ["newLeaderboardPlayers"],
  });

  useEffect(() => {
    const handleLeaderboardUpdate = async (
      data: Tuple<WsLeaderboardPlayerUpdate>
    ) => {
      queryClient.setQueryData(["leaderboard"], (prev: LeaderbordPlayer[]) => {
        let usersToFetch = [...data];

        if (!prev) {
          newLeaderboardPlayers.mutate(data.flatMap((u) => u.userId));
          return undefined;
        }

        const newLeaderoard = prev.map((player) => {
          const playerUpdate = data.find((p) => p.userId === player.id);
          if (!playerUpdate) return player;

          usersToFetch = usersToFetch.filter((u) => u.userId !== player.id);
          return {
            ...player,
            losses: !playerUpdate.isWinner ? player.losses + 1 : player.losses,
            wins: playerUpdate.isWinner ? player.wins + 1 : player.wins,
            rating: playerUpdate.rating,
          };
        });

        usersToFetch = usersToFetch.filter(
          (u) => u.rating > prev[prev.length - 1].rating
        );
        if (usersToFetch.length) {
          console.log("usersToFetch", usersToFetch);
          newLeaderboardPlayers.mutate(usersToFetch.flatMap((u) => u.userId));
        }

        newLeaderoard.sort((a, b) => b.rating - a.rating);
        return newLeaderoard;
      });
    };

    socket.on("leaderboardUpdate", handleLeaderboardUpdate);
    return () => {
      socket.off("leaderboardUpdate", handleLeaderboardUpdate);
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {leaderboard.data && (
        <table className="border-separate border-spacing-x-0 border-spacing-y-[2px]">
          <thead className="">
            <tr className="opacity-100">
              <th className="text-left max-w-0"></th>
              <th className="text-left px-5 pb-3 max-w-0 pr-0">Rank</th>
              <th className="text-left px-5 pb-3">Player</th>
              <th className="px-5 pb-3 text-center">Rating</th>
              <th className="text-left w-full"></th>
              <th className="px-5 pb-3 text-center">Wins</th>
              <th className="px-5 pb-3 text-center">Losses</th>
            </tr>
          </thead>

          <tbody>
            {leaderboard.data?.map((player, i) => {
              return <LeaderboardPlayer key={i} i={i} player={player} />;
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function LeaderboardPlayer({
  i,
  player,
}: {
  i: number;
  player: LeaderbordPlayer;
}) {
  return (
    <tr className="relative rounded-lg font-[800] cursor-pointer group">
      <td className="absolute w-full h-full p-0">
        <div className="w-full h-full group-hover:bg-[rgba(255,255,255,0.1)] group-odd:bg-[rgba(255,255,255,0.05)] rounded-md "></div>
      </td>

      <td className="font-[900] font-gameFont px-5 py-3 text-xl text-center">
        #{i + 1}
      </td>

      <td className="px-5 py-3">
        <div className="flex gap-3 items-center relative">
          <Avatar imgUrl={undefined} size="md" userId={player.id} />
          <span className="font-[800] text-base">{player.username}</span>
        </div>
      </td>

      <td className="px-5 py-3">
        <div className="text-indigo-400 rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10 w-min">
          <InfiniteSlotMachine state={player.rating} />
        </div>
      </td>

      <td />

      <td className="px-5 py-3">
        <div className="text-green-500 flex items-center justify-center">
          <InfiniteSlotMachine state={player.wins} />
        </div>
      </td>

      <td className="px-5 py-3">
        <div className="text-red-500 flex items-center justify-center">
          <InfiniteSlotMachine state={player.losses} />
        </div>
      </td>
    </tr>
  );
}

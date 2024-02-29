import { useContext, useEffect } from "react";
import { Avatar } from "../UIKit/avatar/Avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { LeaderbordPlayer } from "../../../api/src/types/games";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import {
  Tuple,
  WsLeaderboardPlayerUpdate,
} from "../../../api/src/types/gameServer/socketPayloadTypes";
import { PlayerRating } from "../UIKit/PlayerRating";

export default function Leaderboard({ limit }: { limit?: number }) {
  const {
    gameSocketOn,
    gameSocketOff,
    addUsersStatusHandler,
    removeUsersStatusHandler,
  } = useContext(SocketsContext);
  const queryClient = useQueryClient();

  const leaderboard = useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async () => {
      const res = await axios.get<LeaderbordPlayer[]>(
        `/api/players/leaderboard${limit ? `?limit=${limit}` : ""}`
      );
      return res.data;
    },
  });

  const newLeaderboardPlayers = useMutation({
    mutationFn: async (userIds: number[]) => {
      const res = await axios.post<LeaderbordPlayer[]>(
        `/api/players/leaderboard`,
        userIds
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["leaderboard", limit],
        (prev: LeaderbordPlayer[]) => {
          if (!prev) return data;
          const newLeaderboard = [...prev, ...data];
          newLeaderboard.sort((a, b) => b.rating - a.rating);
          if (limit) return newLeaderboard.splice(0, limit);
          return newLeaderboard;
        }
      );
    },
  });

  useEffect(() => {
    const handleLeaderboardUpdate = async (
      data: Tuple<WsLeaderboardPlayerUpdate>
    ) => {
      queryClient.setQueryData(
        ["leaderboard", limit],
        (prev: LeaderbordPlayer[]) => {
          if (!prev) {
            newLeaderboardPlayers.mutate(data.flatMap((u) => u.userId));
            return undefined;
          }

          let usersToFetch = [...data];
          const newLeaderoard = prev.map((player) => {
            const playerUpdate = data.find((p) => p.userId === player.id);
            if (!playerUpdate) return player;
            usersToFetch = usersToFetch.filter((u) => u.userId !== player.id);

            return {
              ...player,
              losses: !playerUpdate.isWinner
                ? player.losses + 1
                : player.losses,
              wins: playerUpdate.isWinner ? player.wins + 1 : player.wins,
              rating: playerUpdate.prevRating + playerUpdate.ratingChange,
            };
          });

          usersToFetch = usersToFetch.filter(
            (u) => u.prevRating + u.ratingChange > prev[prev.length - 1].rating
          );
          if (usersToFetch.length) {
            newLeaderboardPlayers.mutate(usersToFetch.flatMap((u) => u.userId));
          }

          newLeaderoard.sort((a, b) => b.rating - a.rating);
          return newLeaderoard;
        }
      );
    };

    gameSocketOn("leaderboardUpdate", handleLeaderboardUpdate);
    return () => {
      gameSocketOff("leaderboardUpdate", handleLeaderboardUpdate);
    };
  }, [gameSocketOn, gameSocketOff]);

  useEffect(() => {
    addUsersStatusHandler({
      key: "leaderboard",
      statusHandler: (data) => {
        queryClient.setQueryData(
          ["leaderboard", limit],
          (prev: LeaderbordPlayer[]) => {
            if (!prev) return undefined;

            const newLeaderboard = prev.map((player) => {
              if (player.id !== data.userId) return player;
              return {
                ...player,
                status: data.status,
              };
            });

            return newLeaderboard;
          }
        );
      },
    });
    return () => removeUsersStatusHandler("leaderboard");
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {leaderboard.data?.length ? (
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
            {leaderboard.data.map((player, i) => {
              return <LeaderboardPlayer key={i} i={i} player={player} />;
            })}
          </tbody>
        </table>
      ) : (
        <span className="text-lg opacity-50">No leaderboard yet</span>
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
    <tr className="relative rounded-lg font-bold cursor-pointer group">
      <td className="absolute w-full h-full p-0">
        <div className="w-full h-full group-hover:bg-[rgba(255,255,255,0.1)] group-odd:bg-[rgba(255,255,255,0.05)] rounded-md "></div>
      </td>

      <td className="font-[900] font-gameFont px-5 py-3 text-xl text-center">
        #{i + 1}
      </td>

      <td className="px-5 py-3">
        <div className="flex gap-3 items-center relative">
          <Avatar
            imgUrl={undefined}
            size="md"
            userId={player.id}
            status={player.status}
          />
          <span className="font-extrabold text-base">{player.username}</span>
        </div>
      </td>

      <td className="px-5 py-3">
        <PlayerRating rating={player.rating} />
      </td>

      <td />

      <td className="px-5 py-3">
        <div className="text-green-500 flex items-center justify-center">
          {player.wins}
        </div>
      </td>

      <td className="px-5 py-3">
        <div className="text-red-500 flex items-center justify-center">
          {player.losses}
        </div>
      </td>
    </tr>
  );
}

import { useContext, useEffect, useState } from "react";
import { GameSocketContext } from "../contextsProviders/GameSocketContext";
import { LiveGameDto, LiveGamesDto } from "../../../api/src/types/game";
import { Avatar } from "../UIKit/Avatar";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function () {
  const socket = useContext(GameSocketContext);
  const [games, setGames] = useState<LiveGameDto[]>();

  const liveGames = useQuery({
    queryKey: ["getLiveGames"],
    queryFn: async () => {
      const res = await axios.get<LiveGameDto[]>("/api/games/public");
      console.log(res);
      return res.data;
    },
  });

  useEffect(() => {
    if (liveGames.isPending) return;

    setGames(liveGames.data);
  }, [liveGames]);

  useEffect(() => {
    // const handleLiveGames = () => {

    // };

    // socket.emit("liveGames", undefined, (games: GameStateType) => {
    //   console.log(games);
    // });

    return () => {
      // socket.off("liveGames", handleLiveGames);
    };
  }, [socket]);

  return (
    <div className="w-full flex flex-col gap-5">
      <SectionTitle />

      <div className="grid grid-cols-3 gap-5">
        {games?.map((game, i) => {
          return <LiveGameCard key={i} game={game} />;
        })}
      </div>

      <div className="self-end">
        <button className="font-title">See More</button>
      </div>
    </div>
  );
}

function SectionTitle() {
  const socket = useContext(GameSocketContext);
  const [liveStats, setLiveStats] = useState<LiveGamesDto>();

  useEffect(() => {
    socket.emit("liveStats", (data: LiveGamesDto) => {
      console.log(data);
      setLiveStats(data);
    });
  }, []);

  return (
    <div className="flex gap-3 items-center">
      <div className="relative">
        <div className="h-[10px] w-[10px] aspect-square rounded-full bg-green-600"></div>
        <div className="absolute top-0 animate-ping h-[10px] w-[10px] aspect-square rounded-full bg-green-600"></div>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="font-title text-3xl font-[900]">Live Games</h1>
        {/* {liveStats && (
          <>
            <div className="text-sm font-title text-green-400 font-bold rounded-md px-2 py-[2px] bg-green-400 bg-opacity-10">
              {liveStats.usersOnline} Online
            </div>
            <div className="text-sm text-indigo-400 font-title font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
              {liveStats.games} {liveStats.games === 1 ? "Game" : "Games"}
            </div>
          </>
        )} */}
      </div>
    </div>
  );
}

function LiveGameCard({ game }: { game: LiveGameDto }) {
  return (
    <div className="relative cursor-pointer transition hover:scale-[1.01] origin-bottom hover:shadow-card-xl ease-out shadow-card min-w-[200px] flex-1 rounded-md bg-zinc-900 py-2 px-2 flex items-center justify-center">
      {/* <div className="flex items-center gap-1 font-title text-xs px-[7px] py-[2px] absolute right-1 top-1 rounded-full opacity-60 border-green-600 text-white-600">
        <div className="h-[8px] w-[8px] rounded-full bg-red-600"></div>
        <span>14 Viewers</span>
      </div> */}
      <div className="flex flex-col w-full justify-center">
        <div className="flex items-start gap-3 flex-1">
          <Avatar imgUrl={undefined} size="lg" userId={game.players[0].id} />
          <div className="flex items-center gap-2">
            <span className="text-lg font-title font-bold">
              {game.players[0].username}
            </span>
            <div className="text-xs font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
              {game.players[0].rating}
            </div>
          </div>
        </div>

        <span className="flex items-center gap-2 absolute self-center font-gameFont">
          <span>{game.players[0].score}</span>
          <span className="text-xs">-</span>
          <span>{game.players[1].score}</span>
        </span>

        <div className="flex items-end gap-3 self-end">
          <div className="flex items-center gap-2">
            <span className="text-lg font-title font-bold">
              {game.players[1].username}
            </span>
            <div className="text-xs font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
              {game.players[1].rating}
            </div>
          </div>
          <Avatar imgUrl={undefined} size="lg" userId={game.players[1].id} />
        </div>
      </div>

      <div></div>
    </div>
  );
}

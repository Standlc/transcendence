import { useMemo, useState } from "react";
import { Avatar } from "../UIKit/Avatar";

interface PlayerType {
  id: number;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  nbGames: number;
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<PlayerType[]>(
    [0, 1, 2, 3, 4, 5].map((i) => {
      return {
        id: 3,
        username: "Altman",
        elo: 2856,
        wins: 143,
        losses: 42,
        nbGames: 524,
      };
    })
  );

  const topThree = useMemo(() => {
    return players.slice(0, 3);
  }, [players]);

  const restOfPlayers = useMemo(() => {
    return players.slice(4, -1);
  }, [players]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-title text-3xl font-[900]">Leaderboard</h1>
      <div className="flex gap-5 self-center w-full flex-wrap items-end">
        {/* {topThree[2] && (
          <div
            style={{ marginTop: 120 }}
            className="flex flex-col gap-3 text-xl bg-zinc-900 p-5 rounded-lg shadow-card flex-1"
          >
            <div className="flex gap-3 items-start">
              <Avatar
                imgUrl={undefined}
                // size={!i ? "2xl" : "xl"}
                size="xl"
                userId={topThree[2].id}
              />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-[800]">
                  {topThree[2].username}
                </span>
                <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
                  {topThree[2].elo}
                </div>
              </div>
            </div>
          </div>
        )} */}

        {topThree.map((player, i) => {
          // if (i == 2) {
          //   return null;
          // }
          return (
            <div
              key={i}
              style={{ marginTop: i * 0 }}
              className="flex-1 flex flex-col justify-end cursor-pointer gap-2"
            >
              <span
                style={{
                  fontSize: !i ? "35px" : "25px",
                }}
                className="font-[900] font-gameFont z-0 opacity-50 leading-none"
              >
                #{i + 1}
              </span>
              <div className="relative flex flex-1 flex-col gap-3 text-xl  bg-zinc-900 p-2 rounded-lg shadow-card">
                <div className="flex gap-3 items-start relative">
                  <Avatar
                    imgUrl={undefined}
                    size={!i ? "2xl" : "xl"}
                    // size="xl"
                    userId={player.id}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-[800]">
                        {player.username}
                      </span>

                      <div className="text-sm font-title text-indigo-400 font-bold rounded-md px-2 py-[2px] bg-indigo-400 bg-opacity-10">
                        {player.elo}
                      </div>
                    </div>

                    <div className="flex flex-col text-base items-start opacity-50 font-[700]">
                      <span>{player.nbGames} Games</span>
                      {/* 
                      <div className="flex items-center">
                        <span>{player.wins} Wins</span>
                      </div>

                      <div className="flex items-center">
                        <span>{player.losses} Losses</span>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

{
  /* <ArrowDropUpRounded sx={{ fontSize: 20 }} /> */
}

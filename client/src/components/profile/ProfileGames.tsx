import { UserGame } from "@api/types/games";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Spinner } from "../../UIKit/Kit";
import { GameInfo } from "../playPage/LiveGames";

export const ProfileGames = ({ userId }: { userId: number }) => {
  const games = useQuery({
    queryKey: ["profileGames", userId],
    queryFn: async () => {
      const res = await axios.get<UserGame[]>(`/api/games/history/${userId}`);
      return res.data;
    },
  });

  if (games.isError) {
    return <div>{games.error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-[2px]">
      {!games.data ? (
        <Spinner isLoading />
      ) : !games.data.length ? (
        <span className="opacity-50 py-5">This user hasn't played any games yet</span>
      ) : (
        games.data.map((game, i) => {
          return <GameInfo key={i} game={game} />;
        })
      )}
    </div>
  );
};

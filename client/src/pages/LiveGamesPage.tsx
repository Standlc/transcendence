import LiveGames from "../components/playPage/LiveGames";

export const LiveGamesPage = () => {
  return (
    <div className="flex flex-col gap-10 w-full h-full">
      <div className="flex items-center justify-center gap-5">
        <div className="h-[10px] w-[10px] m-[7px] flex aspect-square rounded-full bg-green-600 before:content-[''] before:rounded-full before:h-full before:w-full before:animate-ping before:bg-green-600"></div>
        <h1 className="text-4xl font-extrabold">Live Games</h1>
      </div>

      <LiveGames />
    </div>
  );
};

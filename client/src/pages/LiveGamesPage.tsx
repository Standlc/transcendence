import LiveGames from "../components/LiveGames";

export const LiveGamesPage = () => {
  return (
    <div className="w-full h-full p-5 max-w-[1100px]">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <div className="h-[10px] w-[10px] flex aspect-square rounded-full bg-green-600 before:content-[''] before:rounded-full before:h-full before:w-full before:animate-ping before:bg-green-600"></div>
          <h1 className="text-3xl font-[900]">Live Games</h1>
        </div>

        <LiveGames />
      </div>
    </div>
  );
};

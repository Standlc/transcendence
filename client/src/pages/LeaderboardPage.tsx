import Leaderboard from "../components/Leaderboard";

export const LeaderboardPage = () => {
  return (
    <div className="w-full h-full p-5 max-w-[1100px]">
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-[900] font-title">🥇 Leaderboard</h1>
        <Leaderboard />
      </div>
    </div>
  );
};

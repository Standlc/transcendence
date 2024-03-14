import Leaderboard from "../components/playPage/Leaderboard";

export const LeaderboardPage = () => {
  return (
    <div className="flex flex-col gap-10 w-full h-full">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold font-title">🥇 Leaderboard</h1>
        <span className="opacity-50">
          Reach the greatest of hights, and brag to your friends!
        </span>
      </header>
      <Leaderboard />
    </div>
  );
};

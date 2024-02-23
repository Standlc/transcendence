import { useParams } from "react-router-dom";
import { Spinner } from "../UIKit/Kit";
import {
  Achievement,
  LockedAchievement,
} from "../components/achievements/Achievement";
import { useUserAchievements } from "../utils/useUserAchievements";

export const AchievementsPage = () => {
  const { userId } = useParams();
  const { achievements, lockedAchievements } = useUserAchievements({
    userId: Number(userId),
    getLockedAchievents: true,
  });
  const isLoading = achievements.isLoading || !achievements.data;

  if (achievements.isError) {
    return <div>We couldn't find this user</div>;
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <header className="">
        <h1 className="text-3xl font-[900]">Achievements</h1>
        <span className="opacity-50">
          Reach the greatest of hights, and brag to your friends!
        </span>
      </header>

      {isLoading ? (
        <Spinner isLoading />
      ) : (
        <div className="flex flex-col gap-5">
          {!achievements.data.length ? (
            <span className="text-lg opacity-50">
              No achievements unlocked yet
            </span>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {achievements.data.map((achievement, i) => {
                return <Achievement key={i} achievement={achievement} />;
              })}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <span className="text-lg opacity-50">Locked Achievements</span>
            <div className="grid grid-cols-2 gap-3">
              {lockedAchievements.map((achievement, i) => {
                const userAchievement = achievement.hasLevels
                  ? achievements.data.find((a) => a.type === achievement.type)
                  : undefined;
                const level = achievement.hasLevels
                  ? userAchievement
                    ? userAchievement.level
                    : 0
                  : undefined;
                return (
                  <LockedAchievement
                    key={i}
                    achievement={achievement}
                    currentLevel={level}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

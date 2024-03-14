import { Spinner } from "../../UIKit/Kit";
import { Achievement, LockedAchievement } from "../achievements/Achievement";
import { useUserAchievements } from "../../utils/useUserAchievements";

export const ProfileAchievements = ({ userId }: { userId: number }) => {
  const { achievements, lockedAchievements } = useUserAchievements({
    userId: userId,
    getLockedAchievents: true,
  });

  if (achievements.isError) {
    return <div>We couldn't find this user</div>;
  }

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* <header className="">
        <h1 className="text-3xl font-[900]">Achievements</h1>
        <span className="opacity-50">
          Reach the greatest of hights, and brag to your friends!
        </span>
      </header> */}

      {!achievements.data ? (
        <Spinner isLoading />
      ) : (
        <div className="flex flex-col gap-5">
          {!achievements.data.length ? (
            <span className="text-base text-center opacity-50 py-5">
              No achievements unlocked yet
            </span>
          ) : (
            <div className="grid gap-2">
              {achievements.data.map((achievement, i) => {
                return <Achievement key={i} achievement={achievement} />;
              })}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <span className="text-base opacity-50">Locked Achievements</span>
            <div className="grid gap-2">
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

import { Spinner } from "../../UIKit/Kit";
import { PlayerRating } from "../../UIKit/PlayerRating";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useUserFriends } from "../../utils/useUserFriends";

export const ProfileFriends = ({
  userId,
  goTo,
}: {
  userId: number;
  goTo: (userId: number | undefined) => any;
}) => {
  const friends = useUserFriends(userId);

  if (friends.isError) {
    return <div className="">Error</div>;
  }

  return (
    <div className="flex flex-col gap-[2px]">
      {!friends.data ? (
        <Spinner isLoading />
      ) : !friends.data.length ? (
        <span className="opacity-50 py-5">
          This user doesn't have any friends yet
        </span>
      ) : (
        friends.data.map((friend, i) => {
          return (
            <div
              onClick={() => goTo(friend.id)}
              key={i}
              className="flex cursor-pointer justify-between bg-white bg-opacity-0 hover:bg-opacity-10 p-2 rounded-md"
            >
              <div className="flex gap-3 items-center">
                <Avatar
                  borderRadius={1}
                  imgUrl={friend.avatarUrl}
                  userId={friend.id}
                  status={friend.status}
                  size="md"
                />
                <span className="font-bold">{friend.username}</span>
                <PlayerRating rating={friend.rating} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

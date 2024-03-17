import { useGetUser } from "../../utils/useGetUser";
import { Spinner } from "../../UIKit/Kit";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useRef, useState } from "react";
import { Check } from "@mui/icons-material";
import { useCreateChannel } from "../../utils/channels/useCreateChannel";
import { useGetFriends } from "../../utils/friends/useGetFriends";
import { UserFriend } from "@api/types/clientSchema";
import { ChannelSetup } from "./ChannelSetup";
import ModalLayout from "../../UIKit/ModalLayout";

export const CreateChannelCard = ({ hide }: { hide: () => void }) => {
  const user = useGetUser();
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [name, setName] = useState("");
  const friends = useGetFriends(user.id);

  const createChannel = useCreateChannel({
    onSuccess: () => {
      hide();
    },
  });

  return (
    <ModalLayout onClickOutside={hide}>
      <div
        ref={cardRef}
        className="flex flex-col bg-bg-1 p-4 border border-[rgba(0,0,0,0.3)] text-left rounded-md shadow-md right-0 gap-5 min-w-96"
      >
        <span className="text-2xl font-extrabold">Select Friends</span>

        <div className="flex flex-col gap-[2px] overflow-y-auto max-h-80">
          {friends.isError ? (
            <span>Error while loading friends</span>
          ) : !friends.data ? (
            <Spinner isLoading />
          ) : !friends.data.length ? (
            <span className="">You don't have any friends yet</span>
          ) : (
            friends.data.map((friend, i) => {
              const isSelected = selectedFriends.some((id) => friend.id === id);
              return (
                <Friend
                  key={i}
                  friend={friend}
                  isSelected={isSelected}
                  onSelect={() => {
                    if (!isSelected) {
                      setSelectedFriends([...selectedFriends, friend.id]);
                    } else {
                      setSelectedFriends(
                        selectedFriends.filter((id) => id !== friend.id)
                      );
                    }
                  }}
                />
              );
            })
          )}
        </div>

        <ChannelSetup
          namePlaceHolder={"Channel name"}
          name={[name, setName]}
          isProtected={[isProtected, setIsProtected]}
          isPublic={[isPublic, setIsPublic]}
          password={[password, setPassword]}
        />

        <button
          disabled={name === ""}
          onClick={() => {
            createChannel.mutate({
              isPublic: isPublic,
              memberIds: selectedFriends,
              name: name,
              password: password,
            });
          }}
          className="bg-indigo-500 rounded-md font-bold text-lg px-4 py-2 w-full disabled:opacity-50"
        >
          Create Channel
        </button>
      </div>
    </ModalLayout>
  );
};

const Friend = ({
  friend,
  isSelected,
  onSelect,
}: {
  friend: UserFriend;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  return (
    <div
      onClick={onSelect}
      className="px-2 py-1 cursor-pointer flex items-center justify-between hover:bg-white hover:bg-opacity-5 rounded-sm"
    >
      <div className="flex items-center gap-3">
        <div className="">
          <Avatar
            borderRadius={1}
            userId={friend.id}
            size="sm"
            imgUrl={friend.avatarUrl}
            status={friend.status}
          />
        </div>
        <span className="font-bold">{friend.username}</span>
      </div>

      <div
        aria-selected={isSelected}
        className="h-[20px] flex items-center justify-center aspect-square border-[rgba(255,255,255,0.2)] border-[1px] rounded-md aria-selected:border-indigo-500"
      >
        {isSelected && <Check style={{ fontSize: 15 }} />}
      </div>
    </div>
  );
};

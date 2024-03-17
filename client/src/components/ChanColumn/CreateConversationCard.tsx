import { UserFriend } from "@api/types/clientSchema";
import { useQuery } from "@tanstack/react-query";
import { useGetUser } from "../../utils/useGetUser";
import axios from "axios";
import { Spinner } from "../../UIKit/Kit";
import { Avatar } from "../../UIKit/avatar/Avatar";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useStartConversation } from "../../utils/conversations/useStartConversation";
import { QuestionAnswer } from "@mui/icons-material";
import ModalLayout from "../../UIKit/ModalLayout";

export const CreateConversationCard = ({ hide }: { hide: () => void }) => {
  const navigate = useNavigate();
  const user = useGetUser();
  const cardRef = useRef<HTMLDivElement>(null);
  const startConversation = useStartConversation();

  const friends = useQuery<UserFriend[]>({
    queryKey: ["friends", user.id],
    queryFn: async () => {
      const res = await axios.get(`/api/friends?id=${user.id}`);
      return res.data;
    },
  });

  return (
    <ModalLayout onClickOutside={hide}>
      <div
        ref={cardRef}
        className="flex flex-col bg-bg-1 p-4 border border-[rgba(0,0,0,0.3)] text-left rounded-md shadow-md right-0 gap-4 min-w-96"
      >
        <div className="flex flex-col">
          <span className="text-2xl font-extrabold">Start a conversation</span>
          <span className="opacity-50 text-base">
            Send private messages to a friend
          </span>
        </div>

        <div className="flex flex-col gap-[2px] overflow-y-auto max-h-80">
          {friends.isError ? (
            <span>Error while loading friends</span>
          ) : !friends.data ? (
            <Spinner isLoading />
          ) : !friends.data.length ? (
            <span className="">You don't have any friends yet</span>
          ) : (
            friends.data.map((friend, i) => {
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (friend.conversationId === null) {
                      startConversation.mutate(friend.id);
                    } else {
                      navigate(`/home/dm/${friend.conversationId}`);
                    }
                    hide();
                  }}
                  className="px-2 py-1 cursor-pointer flex items-center justify-between hover:bg-white hover:bg-opacity-5 rounded-sm group"
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

                  <button
                    className={`flex justify-center items-center h-[35px] aspect-square rounded-full font-bold group-hover:opacity-100 opacity-70 ${
                      friend.conversationId === null
                        ? "bg-indigo-500 group-hover:bg-opacity-100"
                        : "bg-black bg-opacity-20 group-hover:bg-opacity-40"
                    }`}
                  >
                    <QuestionAnswer fontSize="small" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ModalLayout>
  );
};

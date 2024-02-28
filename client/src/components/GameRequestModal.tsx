import { useContext, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import axios from "axios";
import ModalLayout from "../UIKit/ModalLayout";
import { UserContext } from "../ContextsProviders/UserContext";
import { Avatar } from "../UIKit/avatar/Avatar";
import { PlayerRating } from "../UIKit/PlayerRating";
import { useGameRequest } from "../utils/useGameRequest";
import { SocketsContext } from "../ContextsProviders/SocketsContext";

export const GameRequestModal = () => {
  const { user } = useContext(UserContext);
  const { gameSocketOn, gameSocketOff } = useContext(SocketsContext);
  const gameRequest = useGameRequest();
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();

  const cancel = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/api/game-requests`);
      queryClient.setQueryData(["currentGameRequest"], null);
      return res.data;
    },
    onError: () => {
      addError({ message: "something went wrong" });
    },
  });

  useEffect(() => {
    if (!gameRequest.data || !gameRequest.data?.targetUser) return;

    const handleInvitationRefused = () => {
      queryClient.setQueryData(["currentGameRequest"], null);
    };

    gameSocketOn("gameInvitationRefused", handleInvitationRefused);
    return () => {
      gameSocketOff("gameInvitationRefused", handleInvitationRefused);
    };
  }, [gameSocketOn, gameSocketOff, gameRequest.data]);

  if (!gameRequest.data) {
    return null;
  }

  return (
    <ModalLayout>
      <div className="flex flex-col gap-7 p-5 max-w-80">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-extrabold">
            {gameRequest.data.targetUser == null ? (
              "Looking for a game"
            ) : (
              <>Inviting {gameRequest.data.targetUser.username} for a game</>
            )}
          </span>
          <span className="opacity-50 text-center">
            {gameRequest.data.targetUser == null ? (
              <>
                We're connecting you to a <b>rated</b>
              </>
            ) : (
              <>
                You invited {gameRequest.data.targetUser.username} to play an{" "}
                <b>unrated</b>
              </>
            )}{" "}
            game in <b>{gameRequest.data.points}</b> points{" "}
            {gameRequest.data.powerUps && (
              <>
                with <b>power ups</b>
              </>
            )}
          </span>
        </div>

        <div className="relative flex flex-col gap-5 justify-center">
          <div className="animate-pulse">
            <PlayerInfos player={gameRequest.data.targetUser ?? undefined} />
          </div>
          <span className="absolute self-center font-gameFont text-center">
            VS
          </span>
          <PlayerInfos
            player={user}
            style={{
              flexDirection: "row-reverse",
              alignItems: "end",
            }}
          />
        </div>

        <div className="flex flex-col gap-1 items-center -mb-1">
          <div className="h-[3px] w-[100%] overflow-hidden flex justify-center">
            <div className="h-full w-[70%] animate-move-left-right bg-indigo-500 opacity-60"></div>
          </div>
        </div>

        <div
          className="self-end opacity-50 hover:opacity-100 hover:text-red-600"
          onClick={() => cancel.mutate()}
        >
          Cancel
        </div>
      </div>
    </ModalLayout>
  );
};

export const PlayerInfos = ({
  player,
  style,
}: {
  player?: {
    username: string;
    id: number;
    avatarUrl: string | null;
    rating: number;
  };
  style?: React.CSSProperties;
}) => {
  return (
    <div
      style={{ ...style }}
      className="flex font-extrabold items-start gap-3 flex-1"
    >
      <Avatar imgUrl={undefined} size="lg" userId={player?.id ?? -1} />

      <div className="flex gap-3 [flex-direction:inherit] items-center">
        <span
          style={{
            opacity: player?.username ? 1 : 0.5,
          }}
          className="text-lg"
        >
          {player?.username ?? "Finding..."}
        </span>
        {player?.rating ? <PlayerRating rating={player.rating} /> : null}
      </div>
    </div>
  );
};

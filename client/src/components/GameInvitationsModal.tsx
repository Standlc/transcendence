import { useContext, useEffect } from "react";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { useGameInvitations } from "../utils/useGameInvitations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserGameInvitation } from "@api/types/gameRequests";
import { useGameRequest } from "../utils/useGameRequest";
import { PlayerInfos } from "./GameRequestModal";
import { PlayButton } from "../UIKit/PlayButton";
import axios from "axios";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import MultiModalLayout from "../UIKit/MultiModalLayout";
import { useParams } from "react-router-dom";
import { useFetchGame } from "../utils/useFetchGame";

export const GameInvitationModal = () => {
  const { gameId } = useParams();
  const currentGameRequest = useGameRequest();
  const { gameSocketOn, gameSocketOff } = useContext(SocketsContext);
  const gameInvitations = useGameInvitations();
  const queryClient = useQueryClient();
  const gameRecord = useFetchGame(Number(gameId));
  const { addError } = useContext(ErrorContext);

  const declineInvitation = useMutation({
    mutationFn: async (inviterId: number) => {
      const res = await axios.delete(`/api/game-requests/decline/${inviterId}`);
      queryClient.setQueryData(
        ["gameInvitation"],
        (prev: UserGameInvitation[] | undefined) => {
          if (!prev) return undefined;
          return prev.filter((i) => i.inviterUser.id !== inviterId);
        }
      );
      return res.data;
    },
    onError: () => {
      addError({ message: "Error while declining invitation" });
    },
  });

  const acceptInvitation = useMutation({
    mutationFn: async (inviterId: number) => {
      const res = await axios.post(`/api/game-requests/accept/${inviterId}`);
      queryClient.setQueryData(
        ["gameInvitation"],
        (prev: UserGameInvitation[] | undefined) => {
          if (!prev) return undefined;
          return prev.filter((i) => i.inviterUser.id !== inviterId);
        }
      );
      return res.data;
    },
  });

  useEffect(() => {
    const handleNewGameInvitation = (data: UserGameInvitation) => {
      queryClient.setQueryData(
        ["gameInvitation"],
        (prev: UserGameInvitation[] | undefined) => {
          if (!prev) return [data];
          return [...prev, data];
        }
      );
    };

    const handleGameInvitationCanceled = (data: { inviterId: number }) => {
      queryClient.setQueryData(
        ["gameInvitation"],
        (prev: UserGameInvitation[] | undefined) => {
          if (!prev) return undefined;
          return prev.filter((i) => i.inviterUser.id !== data.inviterId);
        }
      );
    };

    gameSocketOn("gameInvitation", handleNewGameInvitation);
    gameSocketOn("gameInvitationCanceled", handleGameInvitationCanceled);
    return () => {
      gameSocketOff("gameInvitation", handleNewGameInvitation);
      gameSocketOff("gameInvitationCanceled", handleGameInvitationCanceled);
    };
  }, [gameSocketOn, gameSocketOff]);

  // FIX THIS
  if (
    currentGameRequest.data ||
    !gameInvitations.data?.length ||
    (gameRecord.data && gameRecord.data.winnerId == null && gameId != null)
  ) {
    return null;
  }

  return (
    <MultiModalLayout>
      {gameInvitations.data.map((invitation, i) => {
        return (
          <div key={i} className="p-5 flex flex-col gap-7 max-w-80">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-center">
                {invitation.inviterUser.username} invited you
              </span>
              <span className="opacity-50 text-center">
                You've been invited to play an <b>unrated</b> game in{" "}
                <b>{invitation.points}</b> points{" "}
                {invitation.powerUps && (
                  <>
                    with <b>power ups</b>
                  </>
                )}
              </span>
            </div>

            <div className="relative flex flex-col gap-5 justify-center">
              <div className="animate-pulse">
                <PlayerInfos player={invitation.inviterUser} />
              </div>
              <span className="absolute self-center font-gameFont text-center">
                VS
              </span>
              <PlayerInfos
                player={invitation.targetUser}
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "end",
                }}
              />
            </div>

            <div className="flex flex-col">
              <PlayButton
                isDisabled={acceptInvitation.isPending}
                onClick={() => {
                  acceptInvitation.mutate(invitation.inviterUser.id);
                }}
              >
                Play
              </PlayButton>
              <button
                disabled={declineInvitation.isPending}
                onClick={() =>
                  declineInvitation.mutate(invitation.inviterUser.id)
                }
                className="mt-5 flex items-center gap-1 self-center opacity-50 hover:text-red-500 hover:opacity-100"
              >
                Decline
              </button>
            </div>
          </div>
        );
      })}
    </MultiModalLayout>
  );
};

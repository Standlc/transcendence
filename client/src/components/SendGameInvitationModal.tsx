import { GamePointsTypes } from "@api/types/gameRequests";
import { useContext, useState } from "react";
import { useSendGameInvitation } from "../utils/useSendGameInvitation";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import { useQueryClient } from "@tanstack/react-query";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import ModalLayout from "../UIKit/ModalLayout";
import { Setting } from "./gameSettings/GameSettings";
import { GAME_POINTS } from "../types/game";
import { PlayButton } from "../UIKit/PlayButton";

export const SendGameInvitationModal = ({
  invitedUser,
  hide,
}: {
  invitedUser: { username: string; id: number };
  hide: () => void;
}) => {
  const { addError } = useContext(ErrorContext);
  const queryClient = useQueryClient();
  const { gameSettings } = useContext(GameSettingsContext);
  const [settings, setSettings] = useState<{
    points: GamePointsTypes;
    powerUps: boolean;
  }>({
    points: gameSettings.points,
    powerUps: gameSettings.powerUps,
  });

  const gameInvitation = useSendGameInvitation({
    onSuccess: (invitation) => {
      queryClient.setQueryData(["currentGameRequest"], invitation);
      hide();
    },
    onError: () => {
      addError({ message: "Error while sending game invitation" });
      hide();
    },
  });

  return (
    <ModalLayout>
      <div className="relative p-5 flex flex-col gap-7 max-w-80 text-left">
        <div className="flex flex-col items-center">
          <span className="font-extrabold text-2xl">Game invitation</span>
          <span className="opacity-50 text-center">
            Choose the settings for your game with <b>{invitedUser.username}</b>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm opacity-50 font-bold">GAME SETTINGS</span>
          <Setting
            onClick={() => {
              const index = GAME_POINTS.indexOf(settings.points);
              const nextIndex = index + 1 >= GAME_POINTS.length ? 0 : index + 1;
              setSettings({ ...settings, points: GAME_POINTS[nextIndex] });
            }}
            title="Points"
          >
            {settings.points}
          </Setting>

          <Setting
            onClick={() =>
              setSettings({ ...settings, powerUps: !settings.powerUps })
            }
            title="Power Ups"
          >
            <div
              aria-selected={settings.powerUps}
              className="aria-selected:text-green-500 text-red-500"
            >
              {settings.powerUps ? "On" : "Off"}
            </div>
          </Setting>
        </div>

        <div className="flex flex-col gap-5">
          <PlayButton
            isDisabled={gameInvitation.isPending}
            onClick={() => {
              gameInvitation.mutate({
                ...settings,
                targetId: invitedUser.id,
              });
            }}
          >
            <span>Send invitation</span>
          </PlayButton>

          <button
            className="self-end opacity-50 hover:opacity-100 hover:text-red-600"
            onClick={() => hide()}
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

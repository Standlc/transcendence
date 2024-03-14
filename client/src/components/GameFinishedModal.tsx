import { UserGame } from "@api/types/games";
import ModalLayout from "../UIKit/ModalLayout";
import { GameFinishedCard } from "./GameFinishedCard";
import { useContext, useMemo, useState } from "react";
import GamePreferences from "./gameSettings/GameSettings";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import { GamePointsTypes } from "@api/types/gameRequests";
import { PlayButton } from "../UIKit/PlayButton";
import { useQueryClient } from "@tanstack/react-query";
import { useIsUserAPlayer } from "../utils/game/useIsUserAPlayer";
import { useFindGameMatch } from "../utils/useFindGameMatch";
import { useSendGameInvitation } from "../utils/useSendGameInvitation";
import { UserContext } from "../ContextsProviders/UserContext";

export const GameFinishedModal = ({ gameRecord }: { gameRecord: UserGame }) => {
  const { user } = useContext(UserContext);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const { gameSettings } = useContext(GameSettingsContext);

  const opponentId = useMemo(
    () =>
      user.id === gameRecord.playerOne.id
        ? gameRecord.playerTwo.id
        : gameRecord.playerOne.id,
    [user.id, gameRecord.playerOne.id]
  );

  const queryClient = useQueryClient();
  const isUserAPlayer = useIsUserAPlayer({ gameRecord });

  const findGame = useFindGameMatch({
    points: gameSettings.points,
    powerUps: gameSettings.powerUps,
  });

  const rematch = useSendGameInvitation({
    onSuccess: (invitation) => {
      queryClient.setQueryData(["currentGameRequest"], invitation);
    },
  });

  return !showGameSettings ? (
    <ModalLayout key={1}>
      <GameFinishedCard
        game={gameRecord}
        PlayButton={
          gameRecord.isPublic
            ? () => {
                return (
                  <PlayButton
                    isDisabled={findGame.isPending}
                    onClick={() => findGame.mutate()}
                  >
                    <span>{isUserAPlayer ? "New Game" : "Play Online"}</span>
                  </PlayButton>
                );
              }
            : () => {
                return (
                  <button
                    disabled={rematch.isPending}
                    className="hover:-translate-y-[1px] flex-auto flex items-center py-4 px-5 justify-center overflow-hidden active:translate-y-[1px] rounded-lg bg-green-600 font-[900] text-2xl shadow-lg"
                    onClick={() =>
                      rematch.mutate({
                        points: gameRecord.points as GamePointsTypes,
                        powerUps: gameRecord.powerUps,
                        targetId: opponentId,
                      })
                    }
                  >
                    <span>Rematch</span>
                  </button>
                );
              }
        }
        showSettings={() => setShowGameSettings(true)}
      />
    </ModalLayout>
  ) : (
    <ModalLayout key={2}>
      <GamePreferences hide={() => setShowGameSettings(false)} />
    </ModalLayout>
  );
};

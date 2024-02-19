import { useContext, useMemo } from "react";
import { UserContext } from "../../ContextsProviders/UserContext";
import { AppGame } from "../../../../api/src/types/games/returnTypes";

export const useIsUserAPlayer = ({
  gameRecord,
}: {
  gameRecord: AppGame | undefined;
}) => {
  const { user } = useContext(UserContext);
  const isUserAPlayer = useMemo(
    () =>
      gameRecord?.playerOne?.id === user.id ||
      gameRecord?.playerTwo?.id === user.id,
    [user.id, gameRecord?.playerOne?.id, gameRecord?.playerTwo?.id]
  );

  return isUserAPlayer;
};

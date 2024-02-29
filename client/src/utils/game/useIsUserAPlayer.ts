import { useContext, useMemo } from "react";
import { UserContext } from "../../ContextsProviders/UserContext";
import { UserGame } from "../../../../api/src/types/games";

export const useIsUserAPlayer = ({
  gameRecord,
}: {
  gameRecord: UserGame | undefined | null;
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

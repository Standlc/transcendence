import { Outlet } from "react-router-dom";
import { AppUser, UserContext } from "../ContextsProviders/UserContext";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import { ErrorModal } from "./ErrorModal";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import { useGamePreferences } from "../utils/game/useGamePreferences";
import { useErrorQueue } from "../utils/useErrorQueue";
import { useUsersStatusSocket } from "../utils/useUsersStautsSocket";
import { useGameSocket } from "../utils/useGameSocket";

export default function PrivateLayout({ user }: { user: AppUser }) {
  const { error, addError, removeCurrentError } = useErrorQueue();
  const gameSocket = useGameSocket(addError);
  const { usersStatusSocket, addHandler, removeHandler } =
    useUsersStatusSocket(addError);
  const [gameSettings, upadteGameSetting] = useGamePreferences();

  if (!gameSocket || !usersStatusSocket) {
    // todo: add a nice loader like Discord before connection is established
    return (
      <ErrorContext.Provider value={{ error, addError, removeCurrentError }}>
        {error && <ErrorModal />}
      </ErrorContext.Provider>
    );
  }

  return (
    <UserContext.Provider value={{ user }}>
      <SocketsContext.Provider
        value={{
          gameSocket,
          usersStatusSocket,
          addUsersStatusHandler: addHandler,
          removeUsersStatusHandler: removeHandler,
        }}
      >
        <ErrorContext.Provider value={{ error, addError, removeCurrentError }}>
          <GameSettingsContext.Provider
            value={{ gameSettings, upadteGameSetting }}
          >
            <div className="min-h-[100vh] min-w-[100vw] w-full h-full">
              {error && <ErrorModal />}
              <Outlet />
            </div>
          </GameSettingsContext.Provider>
        </ErrorContext.Provider>
      </SocketsContext.Provider>
    </UserContext.Provider>
  );
}

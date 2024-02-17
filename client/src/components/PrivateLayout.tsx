import { Outlet } from "react-router-dom";
import { AppUser, UserContext } from "../ContextsProviders/UserContext";
import { useEffect, useState } from "react";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import { Socket, io } from "socket.io-client";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import { ErrorModal } from "./ErrorModal";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import { useGamePreferences } from "../utils/useGamePreferences";
import { useErrorQueue } from "../utils/useErrorQueue";

export default function PrivateLayout({ user }: { user: AppUser }) {
  const [gameSocket, setGameSocket] = useState<Socket>();
  const [gameSettings, upadteGameSetting] = useGamePreferences();
  const { error, addError, removeCurrentError } = useErrorQueue();

  useEffect(() => {
    const connection = io("");
    setGameSocket(connection);
    return () => {
      connection.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!gameSocket) return;
    const handleErrors = (err: Error) => {
      gameSocket.disconnect();
      setGameSocket(undefined);
      console.log(err);
    };

    const handleServerError = (message: string) => {
      addError({ message: "something went wrong with the game server" });
    };

    gameSocket.on("connect_error", handleErrors);
    gameSocket.on("connect_failed", handleErrors);
    gameSocket.on("error", handleServerError);
    return () => {
      if (!gameSocket) return;
      gameSocket.off("connect_error", handleErrors);
      gameSocket.off("connect_failed", handleErrors);
      gameSocket.off("error", handleServerError);
    };
  }, [gameSocket]);

  if (!gameSocket) {
    // todo: add a nice loader like Discord before connection is established
    return null;
  }

  return (
    <UserContext.Provider value={{ user }}>
      <GameSocketContext.Provider value={gameSocket}>
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
      </GameSocketContext.Provider>
    </UserContext.Provider>
  );
}

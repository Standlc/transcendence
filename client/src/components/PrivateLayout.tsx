import { Outlet } from "react-router-dom";
import { AppUser, UserContext } from "../ContextsProviders/UserContext";
import { useEffect, useState } from "react";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import { Socket, io } from "socket.io-client";
import { ErrorContext, ErrorType } from "../ContextsProviders/ErrorContext";
import { ErrorModal } from "./ErrorModal";

export default function PrivateLayout({ user }: { user: AppUser }) {
  const [gameSocket, setGameSocket] = useState<Socket>();
  const [error, setError] = useState<ErrorType | undefined>();

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

    gameSocket.on("connect_error", handleErrors);
    gameSocket.on("connect_failed", handleErrors);

    return () => {
      if (!gameSocket) return;
      gameSocket.off("connect_error", handleErrors);
      gameSocket.off("connect_failed", handleErrors);
    };
  }, [gameSocket]);

  if (!gameSocket) {
    // todo: add a nice loader like Discord before connection is established
    return null;
  }

  return (
    <UserContext.Provider value={{ user }}>
      <GameSocketContext.Provider value={gameSocket}>
        <ErrorContext.Provider value={{ error, setError }}>
          <div className="min-h-[100vh] min-w-[100vw] w-full h-full">
            <ErrorModal />
            <Outlet />
          </div>
        </ErrorContext.Provider>
      </GameSocketContext.Provider>
    </UserContext.Provider>
  );
}

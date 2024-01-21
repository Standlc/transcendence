import { Outlet } from "react-router-dom";
import { AppUser, UserContext } from "../ContextsProviders/UserContext";
import { useEffect, useState } from "react";
import { GameSocketContext } from "../ContextsProviders/GameSocketContext";
import { Socket, io } from "socket.io-client";

export default function PrivateLayout({
  user,
  setUser,
}: {
  user: AppUser;
  setUser: React.Dispatch<React.SetStateAction<AppUser | undefined>>;
}) {
  const [gameSocket, setGameSocket] = useState<Socket>();

  useEffect(() => {
    const connection = io({
      query: {
        userId: user.id,
      },
    });

    setGameSocket(connection);
    return () => {
      connection.disconnect();
    };
  }, [user]);

  if (!gameSocket) {
    // todo: add a nice loader like Discord before connection is established
    return null;
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <GameSocketContext.Provider value={gameSocket}>
        <div>
          <Outlet />
        </div>
      </GameSocketContext.Provider>
    </UserContext.Provider>
  );
}

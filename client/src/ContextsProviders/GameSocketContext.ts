import { Socket } from "socket.io-client";
import { createContext } from "react";

export type GameSocketContextType = {
  socket: Socket;
};

export const GameSocketContext = createContext(undefined as unknown as Socket);

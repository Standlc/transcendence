import { Socket } from "socket.io-client";
import { createContext } from "react";
import {
  AddUsersStatusHandlerFnType,
  RemoveUsersStatusHandlerFnType,
} from "../utils/useUsersStatusSocket";
import { GameSocketEventHandlerType } from "../types/gameSocket";

export type SocketsContextType = {
  gameSocket: Socket;
  gameSocketOn: GameSocketEventHandlerType;
  gameSocketOff: GameSocketEventHandlerType;
  usersStatusSocket: Socket;
  addUsersStatusHandler: AddUsersStatusHandlerFnType;
  removeUsersStatusHandler: RemoveUsersStatusHandlerFnType;
  chatSocket: Socket;
};

export const SocketsContext = createContext(
  undefined as unknown as SocketsContextType
);

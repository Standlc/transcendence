import { Socket } from "socket.io-client";
import { createContext } from "react";
import {
  AddUsersStatusHandlerFnType,
  RemoveUsersStatusHandlerFnType,
} from "../utils/useUsersStautsSocket";

export type SocketsContextType = {
  gameSocket: Socket;
  usersStatusSocket: Socket;
  addUsersStatusHandler: AddUsersStatusHandlerFnType;
  removeUsersStatusHandler: RemoveUsersStatusHandlerFnType;
};

export const SocketsContext = createContext(
  undefined as unknown as SocketsContextType
);

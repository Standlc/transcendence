import { io } from "socket.io-client";

export const gameSocket = io({
  autoConnect: false,
});

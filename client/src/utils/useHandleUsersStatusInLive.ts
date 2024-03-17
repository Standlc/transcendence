import { useContext, useEffect } from "react";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { UsersStatusHandlerType } from "./useUsersStatusSocket";

export const useHandlerUsersStatusInLive = (
  key: string,
  handler: UsersStatusHandlerType<"status">
) => {
  const { addUsersStatusHandler, removeUsersStatusHandler } =
    useContext(SocketsContext);

  useEffect(() => {
    addUsersStatusHandler({
      key,
      statusHandler: handler,
    });

    return () => removeUsersStatusHandler(key);
  }, [addUsersStatusHandler, removeUsersStatusHandler, handler, key]);
};

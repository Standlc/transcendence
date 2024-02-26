import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import {
  UsersStatusEmitsDto,
  WsUserSatus,
} from "../../../api/src/types/usersStatusTypes";

export type UsersStatusHandlerType<T extends string> = (
  data: UsersStatusEmitsDto<T>
) => void;

export type AddUsersStatusHandlerFnPropsType = {
  key: string;
  statusHandler: UsersStatusHandlerType<"status">;
};

export type AddUsersStatusHandlerFnType = (
  handler: AddUsersStatusHandlerFnPropsType
) => void;

export type RemoveUsersStatusHandlerFnType = (key: string) => void;

export const useUsersStatusSocket = (addError: (error: ErrorType) => void) => {
  const [usersStatusSocket, setUsersStatusSocket] = useState<Socket>();
  const handlers = useRef(new Map<string, UsersStatusHandlerType<"status">>());

  useEffect(() => {
    const connection = io("/status");
    setUsersStatusSocket(connection);
    return () => {
      connection.disconnect();
      setUsersStatusSocket(undefined);
    };
  }, []);

  const addListener = <T extends string>(
    ev: T,
    handler: (data: UsersStatusEmitsDto<T>) => void
  ) => {
    if (usersStatusSocket) {
      usersStatusSocket.on(ev, handler as any);
    }
  };

  const removeListener = <T extends string>(
    ev: T,
    handler: (data: UsersStatusEmitsDto<T>) => void
  ) => {
    if (usersStatusSocket) {
      usersStatusSocket.off(ev, handler as any);
    }
  };

  useEffect(() => {
    if (!usersStatusSocket) return;

    const handleErrors = (err: Error) => {
      usersStatusSocket.disconnect();
      setUsersStatusSocket(undefined);
      addError({ message: err.message });
    };

    const handleUserOnline = (data: WsUserSatus) => {
      handlers.current.forEach((handler) => {
        handler(data);
      });
    };

    usersStatusSocket.on("connect_error", handleErrors);
    usersStatusSocket.on("connect_failed", handleErrors);
    addListener("status", handleUserOnline);
    return () => {
      if (!usersStatusSocket) return;
      usersStatusSocket.off("connect_error", handleErrors);
      usersStatusSocket.off("connect_failed", handleErrors);
      removeListener("status", handleUserOnline);
    };
  }, [usersStatusSocket]);

  return {
    usersStatusSocket,
    addHandler: ({ key, statusHandler }: AddUsersStatusHandlerFnPropsType) => {
      handlers.current.set(key, statusHandler);
    },
    removeHandler: (key: string) => {
      handlers.current.delete(key);
    },
  };
};

import { useEffect, useState } from "react";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { Socket, io } from "socket.io-client";

export const useChatSocket = (addError: (error: ErrorType) => void) => {
	const [chatSocket, setChatSocket] = useState<Socket>();

	useEffect(() => {
	  const connection = io("/channel");
	  setChatSocket(connection);
	  return () => {
		connection.disconnect();
		setChatSocket(undefined);
	  };
	}, []);

	return {chatSocket};
}

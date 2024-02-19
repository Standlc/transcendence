import { useState } from "react";
import { ErrorType } from "../ContextsProviders/ErrorContext";

export const useErrorQueue = () => {
  const [errorQueue, setErrorQueue] = useState<ErrorType[]>([]);

  return {
    error: errorQueue.length ? errorQueue[0] : undefined,
    addError: (error: ErrorType) => setErrorQueue((prev) => [...prev, error]),
    removeCurrentError: () => {
      setErrorQueue((prev) => prev.slice(1));
    },
  };
};

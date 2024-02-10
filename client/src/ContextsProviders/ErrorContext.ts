import React from "react";

export interface ErrorType {
  message: string;
}

export interface ErrorContextType {
  error: ErrorType | undefined;
  setError: React.Dispatch<React.SetStateAction<ErrorType | undefined>>;
}

export const ErrorContext = React.createContext(
  undefined as unknown as ErrorContextType
);

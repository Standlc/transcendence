import React from "react";

export interface ErrorType {
  message: string;
  isSuccess?: boolean;
}

export interface ErrorContextType {
  error: ErrorType | undefined;
  addError: (error: ErrorType) => void;
  removeCurrentError: () => void;
}

export const ErrorContext = React.createContext(
  undefined as unknown as ErrorContextType
);

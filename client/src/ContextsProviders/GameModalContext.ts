import React from "react";

export type GameModalType = {
  error?: string;
  isVisible?: boolean;
};

export type GameModalContextType = {
  gameModal: GameModalType;
  setGameModal: React.Dispatch<React.SetStateAction<GameModalType>>;
};

export const GameModalContext = React.createContext<GameModalContextType>(
  undefined as unknown as GameModalContextType
);

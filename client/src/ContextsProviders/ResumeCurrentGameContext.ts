import { Dispatch, SetStateAction, createContext } from "react";

export interface UserCurrentGame {
  id: string;
}

export type ResumeCurrentGameContextType = {
  userCurrentGame: UserCurrentGame | undefined;
  setUserCurrentGame: Dispatch<SetStateAction<UserCurrentGame | undefined>>;
};

export const ResumeCurrentGameContext = createContext(
  undefined as unknown as ResumeCurrentGameContextType
);

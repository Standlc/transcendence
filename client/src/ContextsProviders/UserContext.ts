import { Dispatch, SetStateAction, createContext } from "react";

export interface AppUser {
  id: number;
}

export type UserContextType = {
  user: AppUser;
  setUser: Dispatch<SetStateAction<AppUser | undefined>>;
};

export const UserContext = createContext<UserContextType>(
  undefined as unknown as UserContextType
);

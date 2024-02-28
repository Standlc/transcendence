import { createContext } from "react";
import { AppUser } from "@api/types/clientSchema";

export type UserContextType = {
  user: AppUser;
};

export const UserContext = createContext<UserContextType>(
  undefined as unknown as UserContextType
);

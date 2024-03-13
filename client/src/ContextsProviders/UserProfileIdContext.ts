import React, { Dispatch, SetStateAction } from "react";

export type UserProfileContextType = {
  userProfileId: number | undefined;
  setUserProfileId: Dispatch<SetStateAction<undefined | number>>;
};

export const UserProfileContext = React.createContext<UserProfileContextType>(
  undefined as any as UserProfileContextType
);

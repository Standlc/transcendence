import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../ContextsProviders/UserContext";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import { ErrorModal } from "./ErrorModal";
import { GameSettingsContext } from "../ContextsProviders/GameSettingsContext";
import { useGamePreferences } from "../utils/game/useGamePreferences";
import { useErrorQueue } from "../utils/useErrorQueue";
import { useUsersStatusSocket } from "../utils/useUsersStatusSocket";
import { useGameSocket } from "../utils/useGameSocket";
import { GameRequestModal } from "./GameRequestModal";
import { GameInvitationModal } from "./GameInvitationsModal";
import { AppUser } from "@api/types/clientSchema";
import { NavBar } from "./Navbar/Navbar";
import { useChatSocket } from "../utils/useChatSocket";
import { RejoinGameNotification } from "./RejoinGameNotification";
import { UserProfileContext } from "../ContextsProviders/UserProfileIdContext";
import { useState } from "react";
import { ProfileModal } from "./profile/ProfileModal";
import { useConversationSocket } from "../utils/useConversationSocket";

interface PrivateLayoutProps {
  user: AppUser | undefined;
}

export default function PrivateLayout({ user }: PrivateLayoutProps) {
  if (!user) {
    return <Navigate to="/login" />;
  }

  const { error, addError, removeCurrentError } = useErrorQueue();
  const { gameSocket, gameSocketOn, gameSocketOff } = useGameSocket(addError);
  const { usersStatusSocket, addHandler, removeHandler } =
    useUsersStatusSocket(addError);
  const { chatSocket } = useChatSocket(addError);
  const [gameSettings, upadteGameSetting] = useGamePreferences();
  const [userProfileId, setUserProfileId] = useState<number>();
  const conversationSocket = useConversationSocket(addError);

  if (!gameSocket || !usersStatusSocket || !chatSocket || !conversationSocket) {
    return (
      <ErrorContext.Provider value={{ error, addError, removeCurrentError }}>
        {error && <ErrorModal />}
      </ErrorContext.Provider>
    );
  }

  return (
    <UserContext.Provider value={{ user }}>
      <SocketsContext.Provider
        value={{
          gameSocket,
          gameSocketOn,
          gameSocketOff,
          usersStatusSocket,
          addUsersStatusHandler: addHandler,
          removeUsersStatusHandler: removeHandler,
          chatSocket,
          conversationSocket,
        }}
      >
        <ErrorContext.Provider value={{ error, addError, removeCurrentError }}>
          <GameSettingsContext.Provider
            value={{ gameSettings, upadteGameSetting }}
          >
            <UserProfileContext.Provider
              value={{ userProfileId, setUserProfileId }}
            >
              <div className="flex min-h-[100vh] w-full h-full">
                <NavBar />
                {error && <ErrorModal />}
                <Outlet />
                <ProfileModal />
                <RejoinGameNotification />
                <GameRequestModal />
                <GameInvitationModal />
              </div>
            </UserProfileContext.Provider>
          </GameSettingsContext.Provider>
        </ErrorContext.Provider>
      </SocketsContext.Provider>
    </UserContext.Provider>
  );
}

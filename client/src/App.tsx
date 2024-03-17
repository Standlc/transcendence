import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
} from "react-router-dom";
import PrivateLayout from "./components/PrivateLayout";
import PublicLayout from "./components/PublicLayout";
import PlayPage from "./pages/PlayPage";
import GamePage from "./pages/GamePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LiveGamesPage } from "./pages/LiveGamesPage";
import { Register } from "./pages/LoginRegister/Register";
import { Login } from "./pages/LoginRegister/Login";
import { Settings } from "./pages/Settings/subComponents/Settings";
import { ChannelsLayout } from "./components/ChannelsLayout";
import Chat from "./pages/Chat/Chat";
import { ExplorePage } from "./pages/ExplorePage";
import { PlayPageLayout } from "./components/playPage/PlayPageLayout";
import { AllFriends } from "./pages/Friends/AllFriends";
import { BlockedUsers } from "./pages/BlockedUsersPage";
import { FriendRequests } from "./pages/FriendRequestsPage";
import { AddFriendsPage } from "./pages/AddFriendsPage";
import { Channel } from "./pages/Channel/Channel";
import { Friends } from "./pages/Friends/Friends";
import { LoginTwoFA } from "./pages/LoginRegister/LoginTwoFA";
import { useGetAuthToken } from "./utils/auth/useGetAuthToken";

function App() {
  const user = useGetAuthToken();

  if (user.isLoading) {
    return null;
  }

  return (
    <RouterProvider
      router={createBrowserRouter(
        createRoutesFromElements(
          <>
            <Route
              element={<PrivateLayout user={user.data} />}
              errorElement={<Navigate to="/home" />}
            >
              <Route path="/home" element={<ChannelsLayout />}>
                <Route index element={<Navigate to="friends/all" />} />
                <Route path="friends" element={<Friends />}>
                  <Route index element={<Navigate to="all" />} />
                  <Route path="all" element={<AllFriends />} />
                  <Route path="pending" element={<FriendRequests />} />
                  <Route path="blocked" element={<BlockedUsers />} />
                  <Route path="add" element={<AddFriendsPage />} />
                </Route>
                <Route path="channels/:channelId" element={<Channel />}></Route>
                <Route path="dm/:dmId" element={<Chat />}></Route>
              </Route>

              <Route path="/play/game/:gameId" element={<GamePage />} />
              <Route path="/play" element={<PlayPageLayout />}>
                <Route index element={<Navigate to="game" />}></Route>
                <Route path="game" element={<PlayPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="live" element={<LiveGamesPage />} />
              </Route>

              <Route path="/explore" element={<ExplorePage />} />

              <Route path="/settings" element={<Settings user={user.data} />} />
            </Route>

            <Route
              element={<PublicLayout />}
              errorElement={<Navigate to="/login" />}
            >
              <Route path="/login" element={<Login />} />
              <Route path="/create-account" element={<Register />} />
              <Route path="/login-2fa" element={<LoginTwoFA />} />
            </Route>
          </>
        )
      )}
    />
  );
}

export default App;

import { useState } from "react";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import PrivateLayout from "./components/PrivateLayout";
import PublicLayout from "./components/PublicLayout";
import PlayPage from "./pages/PlayPage";
import GamePage from "./pages/GamePage";
import { AppUser } from "./ContextsProviders/UserContext";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LiveGamesPage } from "./pages/LiveGamesPage";
import { AchievementsPage } from "./pages/AchievementsPage";

function App() {
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const getUser = useQuery({
    queryKey: ["user"],
    retry: false,
    queryFn: async () => {
      const res = await axios.get<AppUser>("/api/auth/token");
      return res.data;
    },
  });

  const logUser = useMutation({
    mutationKey: ["logUser", credentials],
    mutationFn: async () => {
      const res = await axios.post<AppUser>("/api/auth/login", {
        username: credentials.username,
        password: credentials.password,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
    onError: () => {
      // -> handle login error
    },
  });

  if (getUser.isLoading) {
    return null;
  }

  return (
    <RouterProvider
      router={createBrowserRouter(
        createRoutesFromElements(
          <>
            {getUser.data ? (
              <Route
                element={<PrivateLayout user={getUser.data} />}
                errorElement={<div>\(o_o)/</div>}
              >
                <Route index element={<div>home</div>}></Route>
                <Route path="/play" element={<PlayPage />} />
                <Route path="/play/:gameId" element={<GamePage />} />
                <Route
                  path="/achievements/:userId"
                  element={<AchievementsPage />}
                />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/live" element={<LiveGamesPage />} />
              </Route>
            ) : (
              <Route
                element={<PublicLayout />}
                errorElement={<div>\(o_o)/</div>}
              >
                {/* ALL OF THE BELOW IS TO BE REPLACED */}
                <Route
                  index
                  element={
                    <div className="text-black">
                      {logUser.isPending && <span>Loading...</span>}
                      {logUser.isError && <span>{logUser.error.message}</span>}
                      <input
                        placeholder="username"
                        value={credentials.username}
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            username: e.target.value,
                          })
                        }
                      />
                      <br />
                      <br />
                      <input
                        placeholder="password"
                        value={credentials.password}
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            password: e.target.value,
                          })
                        }
                      />
                      <br />
                      <br />
                      <button onClick={() => logUser.mutate()}>LOGIN</button>
                    </div>
                  }
                />
              </Route>
            )}
          </>
        )
      )}
    />
  );
}

export default App;

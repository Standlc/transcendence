import {
    Route,
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
    Navigate,
    createRoutesFromChildren,
    useNavigate,
} from "react-router-dom";
import PrivateLayout from "./components/PrivateLayout";
import PublicLayout from "./components/PublicLayout";
import PlayPage from "./pages/PlayPage";
import GamePage from "./pages/GamePage";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LiveGamesPage } from "./pages/LiveGamesPage";
import { Dashboard } from "./pages/Dashboard";
import { Register } from "./pages/Register";
import { Friends } from "./pages/Friends";
import { Login } from "./pages/Login";
import { Settings } from "./pages/Settings";
import { AppUser } from "@api/types/clientSchema";
import { useEffect } from "react";

function App() {
    const queryClient = useQueryClient();
    const SERVER_URL = "http://localhost:3000/socket.io";

    const getUser = useQuery({
        queryKey: ["user"],
        retry: false,
        queryFn: async () => {
            const res = await axios.get<AppUser>("/api/auth/token");
            return res.data;
        },
    });

    const logUser = useMutation({
        mutationFn: async (credentials: { username: string; password: string }) => {
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

    console.log("getUser.data", getUser.data);
    return (
        <RouterProvider
            router={createBrowserRouter(
                createRoutesFromElements(
                    <>
                        {getUser.data ? (
                            <Route element={<PrivateLayout user={getUser.data} />}>
                                <Route
                                    path="/home"
                                    element={
                                        <Dashboard
                                            SERVER_URL={SERVER_URL}
                                            loginResponse={getUser.data}
                                        />
                                    }
                                />
                                <Route path="/play" element={<PlayPage />} />
                                <Route path="/play/:gameId" element={<GamePage />} />
                                <Route
                                    path="/leaderboard"
                                    element={<LeaderboardPage />}
                                />
                                <Route path="/live" element={<LiveGamesPage />} />
                                <Route
                                    path="/friends"
                                    element={
                                        <Friends
                                            SERVER_URL={SERVER_URL}
                                            loginResponse={getUser.data}
                                        />
                                    }
                                />
                                <Route
                                    path="/settings"
                                    element={<Settings user={getUser.data} />}
                                />
                                <Route
                                    path="/"
                                    element={<Navigate to="/home" replace />}
                                />
                            </Route>
                        ) : (
                            <Route element={<PublicLayout />}>
                                <Route path="/" element={<Login />} />
                                <Route path="/create-account" element={<Register />} />
                                <Route path="/" element={<Navigate to="/login" />} />
                            </Route>
                        )}
                    </>
                )
            )}
        />
    );
}

export default App;

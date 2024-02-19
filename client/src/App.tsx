import {
    Route,
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
} from "react-router-dom";
import PlayPage from "./pages/PlayPage";
import GamePage from "./pages/GamePage";
import { AppUser } from "./ContextsProviders/UserContext";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LiveGamesPage } from "./pages/LiveGamesPage";
import { useState } from "react";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import PongGame from "./pages/PongGame";
import { Register } from "./pages/Register";
import { Friends } from "./pages/Friends";
import { Settings } from "./pages/Settings";
import { AuthProvider } from "./components/RequireAuth/AuthProvider";
import PrivateLayout from "./components/PrivateLayout";

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
            const res = await axios.get<AppUser>("/api/auth/login");
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
        <AuthProvider>
            <RouterProvider
                router={createBrowserRouter(
                    createRoutesFromElements(
                        <>
                            <Route element={<PrivateLayout />}>
                                <Route index element={<Login />} />
                                <Route path="/home" element={<Dashboard />} />
                                <Route path="/play" element={<PongGame />} />
                                <Route path="/create-account" element={<Register />} />
                                <Route path="/friends" element={<Friends />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/play" element={<PlayPage />} />
                                <Route path="/play/:gameId" element={<GamePage />} />
                                <Route
                                    path="/leaderboard"
                                    element={<LeaderboardPage />}
                                />
                                <Route path="/live" element={<LiveGamesPage />} />
                            </Route>
                        </>
                    )
                )}
            />
        </AuthProvider>
    );
}

export default App;

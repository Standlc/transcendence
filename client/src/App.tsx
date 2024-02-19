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
import { AuthProvider, useAuth } from "./components/RequireAuth/AuthProvider";
import { Dashboard } from "./pages/Dashboard";
import { Register } from "./pages/Register";
import { Friends } from "./pages/Friends";
import { Login } from "./pages/Login";
import { Settings } from "./pages/Settings";

function App() {
    const { loginResponse } = useAuth();
    const queryClient = useQueryClient();
    const [credentials, setCredentials] = useState({
        username: "",
        password: "",
    });

    const userId = loginResponse?.id || 0;

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
                            <Route element={<PrivateLayout user={userId} />}>
                                <Route index path="/" element={<Login />} />
                                <Route path="/play" element={<PlayPage />} />
                                <Route path="/play/:gameId" element={<GamePage />} />
                                <Route
                                    path="/leaderboard"
                                    element={<LeaderboardPage />}
                                />
                                <Route path="/live" element={<LiveGamesPage />} />
                                <Route path="/home" element={<Dashboard />} />
                                <Route path="/create-account" element={<Register />} />
                                <Route path="/friends" element={<Friends />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>
                        </>
                    )
                )}
            />
        </AuthProvider>
    );
}

export default App;

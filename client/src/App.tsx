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
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LiveGamesPage } from "./pages/LiveGamesPage";
import { Register } from "./pages/LoginRegister/Register";
import { Friends } from "./pages/Friends/Friends";
import { Login } from "./pages/LoginRegister/Login";
import { Settings } from "./pages/Settings/subComponents/Settings";
import { AppUser } from "@api/types/clientSchema";
import { ChannelsLayout } from "./components/ChannelsLayout";
import Chat from "./pages/Chat/Chat";
import { Channel } from "./pages/Channel";

function App() {
    const queryClient = useQueryClient();

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

    if (getUser.isLoading) {
        return <div className="">Loading...</div>;
    }

    return (
        <RouterProvider
            router={createBrowserRouter(
                createRoutesFromElements(
                    <>
                        <Route
                            element={<PrivateLayout user={getUser.data} />}
                            errorElement={<Navigate to="/home" />}
                        >
                            <Route path="/home" element={<ChannelsLayout />}>
                                <Route path="friends" element={<Friends />} />
                                <Route
                                    path="channels/:channelId"
                                    element={<Channel />}
                                ></Route>
                                <Route path="dm/:dmId" element={<Chat />}></Route>
                            </Route>

                            <Route path="/play" element={<PlayPage />} />
                            <Route path="/play/:gameId" element={<GamePage />} />
                            <Route path="/leaderboard" element={<LeaderboardPage />} />
                            <Route path="/live" element={<LiveGamesPage />} />
                            <Route
                                path="/settings"
                                element={<Settings user={getUser.data} />}
                            />
                        </Route>

                        <Route
                            element={<PublicLayout />}
                            errorElement={<Navigate to="/login" />}
                        >
                            <Route path="/login" element={<Login />} />
                            <Route path="/create-account" element={<Register />} />
                        </Route>
                    </>
                )
            )}
        />
    );
}

export default App;

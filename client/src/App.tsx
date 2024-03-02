import { useState } from "react";
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
import { AuthProvider, useAuth } from "./components/RequireAuth/AuthProvider";
import { Dashboard } from "./pages/Dashboard";
import { Register } from "./pages/Register";
import { Friends } from "./pages/Friends";
import { Login } from "./pages/Login";
import { Settings } from "./pages/Settings";
import { AppUser } from "@api/types/clientSchema";

function App() {
    const { loginResponse } = useAuth();
    const queryClient = useQueryClient();
    const SERVER_URL = "http://localhost:3000/socket.io";

    // Vérifier si l'utilisateur est connecté

    return (
        <AuthProvider>
            <RouterProvider
                router={createBrowserRouter(
                    createRoutesFromElements(
                        <>
                            {loginResponse ? (
                                <Route element={<PrivateLayout user={loginResponse} />}>
                                    <Route
                                        path="/home" // Utiliser /home comme chemin pour le tableau de bord
                                        element={
                                            <Dashboard
                                                SERVER_URL={SERVER_URL}
                                                loginResponse={loginResponse}
                                            />
                                        }
                                    />
                                    <Route path="/play" element={<PlayPage />} />
                                    <Route
                                        path="/play/:gameId"
                                        element={<GamePage />}
                                    />
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
                                                loginResponse={loginResponse}
                                            />
                                        }
                                    />
                                    <Route path="/settings" element={<Settings />} />
                                    {/* Ajouter une redirection de la racine (/) vers /home pour les utilisateurs authentifiés */}
                                    <Route
                                        path="/"
                                        element={<Navigate to="/home" replace />}
                                    />
                                </Route>
                            ) : (
                                <Route element={<PublicLayout />}>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    {/* Rediriger la racine (/) vers /login pour les utilisateurs non authentifiés */}
                                    <Route
                                        path="/"
                                        element={<Navigate to="/login" replace />}
                                    />
                                </Route>
                            )}
                        </>
                    )
                )}
            />
        </AuthProvider>
    );
}

export default App;

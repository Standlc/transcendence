import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { DateTime } from "luxon";
import {
    Route,
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
} from "react-router-dom";
import PrivateLayout from "./components/PrivateLayout";
import PongGame from "./pages/PongGame";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Register } from "./pages/Register";

function App() {
    return (
        <RouterProvider
            router={createBrowserRouter(
                createRoutesFromElements(
                    <>
                        <Route element={<PrivateLayout />}>
                            <Route index element={<Login />} />
                            <Route path="/home" element={<Dashboard />} />
                            <Route path="/play" element={<PongGame />} />
                            <Route path="/create-account" element={<Register />} />
                        </Route>
                    </>
                )
            )}
        />
    );
}

export default App;

import "./App.css";
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
import { AuthProvider, useAuth } from "./components/RequireAuth/AuthProvider";

function App() {
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
                            </Route>
                        </>
                    )
                )}
            />
        </AuthProvider>
    );
}

export default App;

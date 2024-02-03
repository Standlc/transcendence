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
import { useQuery } from "@tanstack/react-query";
import PrivateLayout from "./components/PrivateLayout";
import PublicLayout from "./components/PublicLayout";
import PongGame from "./pages/PongGame";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";

const getUser = async () => {
    const res = await axios.get<any>("/api");
    return res.data;
};

function App() {
    const [user, setUser] = useState<any | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [now, setNow] = useState("");

    useEffect(() => {
        const testApi = async () => {
            const res: { data: string } = await axios.get("/api");
            console.log(res.data);
            setNow(DateTime.fromISO(res.data).toFormat("HH':' mm: ss"));
            // const res = await axios.post<AppUser>("/api/auth/login", {
            //   username: "john",
            //   password: "123",
            // });
            // console.log(res.data);
        };
        testApi();
    }, []);

    const { isPending, data } = useQuery({
        queryKey: ["user"],
        retry: false,
        refetchOnWindowFocus: false,
        queryFn: getUser,
    });

    useEffect(() => {
        if (data) {
            setUser(data);
        }
        setIsLoading(isPending);
    }, [data, isPending]);

    if (isLoading) {
        return "Loading...";
    }

    return (
        <RouterProvider
            router={createBrowserRouter(
                createRoutesFromElements(
                    <>
                        <Route element={<PrivateLayout />}>
                            <Route index element={<Login />} />
                            {/* <Route path="/home" element={<Home now={now} user={user} />} /> */}
                            <Route path="/home" element={<Dashboard now={now} />} />
                            <Route path="/play" element={<PongGame />} />
                        </Route>
                    </>
                )
            )}
        />
    );
}

export default App;

import { ChanColumn } from "../components/ChanColumn";
import { Chatbox } from "../components/Chatbox";
import { NavBar } from "../components/Navbar/Navbar";
import { useAuth } from "../components/RequireAuth/AuthProvider";

export const Dashboard = () => {
    const { loginResponse } = useAuth();

    return (
        <div className="result-page bg-dark-but-not-black ">
            <NavBar />
            <ChanColumn loginResponse={loginResponse} />
            <Chatbox />
        </div>
    );
};

import { useState } from "react";
import { ChanColumn } from "../components/ChanColumn";
import { Chatbox } from "../components/Chatbox";
import { NavBar } from "../components/Navbar/Navbar";
import { useAuth } from "../components/RequireAuth/AuthProvider";
import { Friends } from "./Friends";
import { Chat } from "../components/Chat/Chat";

export const Dashboard = () => {
    const { loginResponse } = useAuth();
    const [currentPage, setCurrentPage] = useState("");

    const changePage = (page: string) => {
        setCurrentPage(page);
    };

    const renderPage = () => {
        if (currentPage === "friends") {
            return <Friends />;
        } else if (currentPage === "chatbox") {
            return <Chatbox />;
        }
    };

    return (
        <div className="result-page bg-dark-but-not-black">
            <NavBar />
            <ChanColumn loginResponse={loginResponse} setCurrentPage={changePage} />
            {renderPage()}
        </div>
    );
};

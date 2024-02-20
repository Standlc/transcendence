import { useState } from "react";
import { ChanColumn } from "../components/ChanColumn";
import { Chatbox } from "../components/Chatbox";
import { NavBar } from "../components/Navbar/Navbar";
import { useAuth } from "../components/RequireAuth/AuthProvider";
import { Friends } from "./Friends";

export const Dashboard = () => {
    const { loginResponse } = useAuth();
    // Note: currentPage now contains both 'page' and 'refreshKey'
    const [currentPage, setCurrentPage] = useState({ page: "", refreshKey: 0 });

    const changePage = (page: string, refreshKey: number = Date.now()) => {
        setCurrentPage({ page, refreshKey });
    };

    const renderPage = () => {
        switch (currentPage.page) {
            case "friends":
                return <Friends key={currentPage.refreshKey} />;
            case "chatbox":
                return <Chatbox />;
            default:
                return null;
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

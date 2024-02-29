import { useState } from "react";
import { ChanColumn } from "../components/ChanColumn";

import { NavBar } from "../components/Navbar/Navbar";
import { useAuth } from "../components/RequireAuth/AuthProvider";
import { Friends } from "./Friends";
import Chat from "../components/Chat/Chat";

export const Dashboard = () => {
    const { loginResponse } = useAuth();
    // Note: currentPage now contains both 'page' and 'refreshKey'
    const [currentPage, setCurrentPage] = useState({ page: "", refreshKey: 0 });
    const SERVER_URL = "http://localhost:5000";
    const [conversationID, setConversationID] = useState<number>(0);
    const [selectedFriend, setSelectedFriend] = useState<{
        id: number;
        username: string;
    } | null>(null);

    const changePage = (page: string, refreshKey: number = Date.now()) => {
        setCurrentPage({ page, refreshKey });
    };

    const renderPage = () => {
        switch (currentPage.page) {
            case "friends":
                return (
                    <Friends
                        loginResponse={loginResponse}
                        key={currentPage.refreshKey}
                        SERVER_URL={SERVER_URL}
                    />
                );
            case "chatbox":
                return (
                    <Chat
                        SERVER_URL={SERVER_URL}
                        conversationID={conversationID}
                        selectedFriend={selectedFriend}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="result-page bg-dark-but-not-black">
            <NavBar />
            <ChanColumn
                loginResponse={loginResponse}
                setCurrentPage={changePage}
                setConversationID={setConversationID}
                setSelectedFriend={setSelectedFriend}
            />
            {renderPage()}
        </div>
    );
};

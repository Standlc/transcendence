import { useState } from "react";
import { MonCompte } from "./Settings/subComponents/MyAccount";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/RequireAuth/AuthProvider";

export const Settings = () => {
    const [currentPage, setCurrentPage] = useState("");
    const [activeButton, setActiveButton] = useState(null);
    const navigate = useNavigate();
    const { loginResponse } = useAuth();
    const handleClick = (page: string) => {
        setCurrentPage(page);
    };

    const renderPage = () => {
        if (currentPage === "Mon Compte") {
            return <MonCompte loginResponse={loginResponse} />;
        }
    };

    const logout = async () => {
        const response = await fetch("http://localhost:3000/api/auth/logout");
        console.log("LOGOUT", response);
        navigate("/");
    };

    return (
        <div className="flex  w-full h-screen">
            <div className="w-[900px] max-w-[650px] min-w-[650px] bg-discord-greyple block text-xl">
                <div className="settings text-left">
                    <span className=" text-greyple mt-[200px] mr-[90px]">
                        PARAMETRES UTILISATEUR
                    </span>
                    <button
                        onClick={() => handleClick("Mon Compte")}
                        className="mb-1  text-left hover:bg-discord-light-grey rounded"
                    >
                        <span className="ml-2 block py-2">Mon compte</span>
                    </button>
                    {/* <button
                        onClick={() => handleClick("Profils")}
                        className="mb-1 text-left hover:bg-discord-light-grey rounded"
                    >
                        <span className="ml-2 block py-2 ">Profils</span>
                    </button> */}
                    <button
                        onClick={() => logout()}
                        className="mb-1 text-left hover:bg-discord-light-grey rounded"
                    >
                        <span className="ml-2 block py-2">Deconnection</span>
                    </button>
                </div>
            </div>
            <div className="w-full bg-not-quite-black">{renderPage()}</div>
        </div>
    );
};

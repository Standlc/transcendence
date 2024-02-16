import { useState } from "react";
import { MonCompte } from "./Settings/subComponents/MyAccount";

export const Settings = () => {
    const [currentPage, setCurrentPage] = useState("");

    const handleClick = (page: string) => {
        setCurrentPage(page);
    };

    const renderPage = () => {
        if (currentPage === "Mon Compte") {
            return <MonCompte />;
        } else if (currentPage === "Profils") {
            return <div>Profils</div>;
        } else if (currentPage === "Deconnetion") {
            return <div>Deconnetion</div>;
        }
    };

    return (
        <div className="flex max-w-[2000px] min-w-[2000px] w-full h-screen">
            <div className="w-1/3 bg-discord-greyple block text-right text-xl">
                <div className="settings text-left">
                    <button className=" text-greyple mr-5 mt-20">
                        PARAMETRES UTILISATEUR
                    </button>
                    <button
                        onClick={() => handleClick("Mon Compte")}
                        className="mb-1  text-left hover:bg-discord-light-grey rounded"
                    >
                        <span className="ml-2">Mon compte</span>
                    </button>
                    <button
                        onClick={() => handleClick("Profils")}
                        className="mb-1 text-left hover:bg-discord-light-grey rounded"
                    >
                        <span className="ml-2">Profils</span>
                    </button>
                    <button
                        onClick={() => handleClick("Deconnetion")}
                        className="mb-1 text-left hover:bg-discord-light-grey rounded"
                    >
                        <span className="ml-2">Deconnection</span>
                    </button>
                </div>
            </div>
            <div className="w-2/3 bg-not-quite-black">{renderPage()}</div>
        </div>
    );
};

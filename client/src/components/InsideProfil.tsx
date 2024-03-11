import { useState } from "react";
import Leaderboard from "./Leaderboard";

export const InsideProfil: React.FC = () => {
    const [activeTab, setActiveTab] = useState("Achievements");
    const Friends = () => <div>Friends Content</div>;
    const [activeButton, setActiveButton] = useState<string | null>(null);

    const renderTabContent = () => {
        switch (activeTab) {
            case "Achievements":
                return <div>achievement</div>;
            case "Match History":
                return <Leaderboard />;
            case "Friends":
                return <Friends />;
            default:
                return <div>Content not found</div>;
        }
    };

    const handleClick = (buttonText: string) => {
        setActiveButton((prevButton) =>
            prevButton === buttonText ? null : buttonText
        );
        setActiveTab(buttonText);
    };

    return (
        <div className="rounded-xl settings-account-body bg-discord-dark-grey mt-4 w-full">
            <div className="flex justify-center">
                <div
                    onClick={() => handleClick("Achievements")}
                    className={`text-xl font-bold mr-[20px] ${
                        activeButton === "Achievements"
                            ? "text-blurple font-extrabold transition duration-300 ease-in-out  "
                            : "hover:text-greyple"
                    }`}
                    style={{ cursor: "pointer" }}
                >
                    Achievements
                </div>

                <div
                    onClick={() => handleClick("Match History")}
                    className={`text-xl font-bold ml-[20px] mr-[20px] ${
                        activeButton === "Match History"
                            ? "text-blurple font-extrabold transition duration-300 ease-in-out "
                            : "hover:text-greyple"
                    }`}
                    style={{ cursor: "pointer" }}
                >
                    Match History
                </div>
                <div
                    onClick={() => handleClick("Friends")}
                    className={`text-xl font-bold ml-[20px]  ${
                        activeButton === "Friends"
                            ? "text-blurple font-extrabold transition duration-300 ease-in-out "
                            : "hover:text-greyple"
                    }`}
                    style={{ cursor: "pointer" }}
                >
                    Friends
                </div>
            </div>
            <div className="rounded-xl bg-discord-dark-grey mt-4 w-full">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default InsideProfil;

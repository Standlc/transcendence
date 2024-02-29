import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const NavBar = () => {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handleClick = (buttonText: string) => {
        setActiveButton((prevButton) =>
            prevButton === buttonText ? null : buttonText
        );
    };

    const buttons = ["user", "chat 1", "Play", "+"];
    return (
        <div className="navbar bg-discord-black">
            {buttons.map((buttonText, index) => (
                <button
                    key={index}
                    className={`mt-4 ml-[20px] p-2 rounded-full  ${
                        activeButton === buttonText
                            ? "rounded-lg bg-blurple hover:bg-blurple"
                            : "bg-not-quite-black hover:rounded-lg hover:bg-blurple"
                    }`}
                    style={{ height: "50px", width: "50px" }}
                    onClick={() => handleClick(buttonText)}
                >
                    {buttonText}
                </button>
            ))}
            <button onClick={() => navigate("/play")}>play</button>
        </div>
    );
};

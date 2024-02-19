import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const NavBar = () => {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState(null);

    const handleClick = (buttonText) => {
        setActiveButton(buttonText);
    };

    const handlePlayClick = () => {
        navigate("/play");
    };

    const buttons = ["user", "chat 1", "Play", "+"];
    return (
        <div className="navbar bg-discord-black block ">
            {buttons.map((buttonText, index) => (
                <button
                    key={index}
                    className={`mt-4 p-2 rounded-full bg-not-quite-black ${
                        activeButton === buttonText
                            ? "rounded-lg bg-blurple hover:bg-blurple"
                            : "hover:rounded-lg hover:bg-blurple"
                    }`}
                    style={{ height: "50px", width: "50px" }}
                    onClick={() => handleClick(buttonText)}
                >
                    {buttonText}
                </button>
            ))}
            <button
                onClick={handlePlayClick}
                className="mt-4 rounded-xl bg-discord-red"
            >
                PLAY
            </button>
        </div>
    );
};

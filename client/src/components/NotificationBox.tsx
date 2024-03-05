import React, { useState, useRef } from "react";
import logo from "./logo.png";

export const NotificationBox: React.FC = () => {
    const [logoSrc, setLogoSrc] = useState("./logo.png");
    const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLImageElement>(null);

    const toggleChatBox = () => {
        setIsChatBoxVisible(!isChatBoxVisible);
    };

    const showChatBox = () => setLogoSrc("./logo_click.png");
    const hideChatBox = () => setLogoSrc("./logo.png");

    return (
        <div>
            <div className="div-chatbox">
                <div className="tooltip">
                    <img
                        alt="logo"
                        src={logo}
                        id="logo-chatbox"
                        onMouseOver={showChatBox}
                        onMouseOut={hideChatBox}
                        onClick={toggleChatBox}
                    />
                    <span className="tooltiptext">Boîte de réception</span>
                </div>
            </div>
            {isChatBoxVisible && (
                <div className="reception-chatbox" ref={chatBoxRef}>
                    <div className="reception-top">
                        <div className="reception-top-top">
                            <img
                                alt="logo"
                                src="./logo_official.png"
                                id="logo-official"
                            />
                            <span id="boite-de-reception">Boîte de réception</span>
                        </div>
                    </div>
                    <div className="reception-body"></div>
                </div>
            )}
        </div>
    );
};

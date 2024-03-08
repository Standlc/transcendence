import React, { useState, useRef } from "react";

export const NotificationBox: React.FC = () => {
    const [isChatBoxVisible, setIsChatBoxVisible] = useState(false);
    const [isPopupVisible, setIsPopupVisible] = useState(false); // State to manage popup visibility
    const chatBoxRef = useRef<HTMLDivElement>(null);

    const toggleChatBox = () => {
        setIsChatBoxVisible(!isChatBoxVisible);
    };

    const showPopup = () => setIsPopupVisible(true);
    const hidePopup = () => setIsPopupVisible(false);

    return (
        <div className="text-right ">
            <div className="mt-2 ">
                <button
                    className="flex items-center justify-center h-[45px] w-[45px] p-2 rounded-full hover:bg-discord-light-grey"
                    onMouseOver={showPopup}
                    onMouseOut={hidePopup}
                    onClick={toggleChatBox}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className=""
                    >
                        <path
                            fillRule="evenodd"
                            d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5Zm-1 3.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5h-2.65c-.5 0-.85.5-.85 1a3 3 0 1 1-6 0c0-.5-.35-1-.85-1H5.5A1.5 1.5 0 0 1 4 11.5v-6Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                {isPopupVisible && (
                    <div className="absolute top-full right-0 bg-discord-light-black text-white  p-1.5 rounded-md shadow-lg ">
                        <span className="text-sm">Notification box</span>
                        {/* X represents the number of new notifications */}
                    </div>
                )}
            </div>
            {isChatBoxVisible && (
                <div className="p-4 bg-gray-100 rounded-lg shadow" ref={chatBoxRef}>
                    <div className="flex items-center gap-2">
                        <img
                            alt="logo"
                            src="./logo_official.png"
                            className="w-8 h-8" // Adjust size as needed
                        />
                        <span className="font-semibold">Boîte de réception</span>
                    </div>
                    {/* Chat box content goes here */}
                    <div className="mt-4">{/* Messages or content */}</div>
                </div>
            )}
        </div>
    );
};

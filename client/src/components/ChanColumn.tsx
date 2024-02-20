import { useNavigate } from "react-router-dom";
import { LoginResponse } from "./RequireAuth/AuthProvider";
import defaultAvatar from "./defaultAvatar.png";
import React from "react";

interface Props {
    loginResponse: LoginResponse | null;
    setCurrentPage: (page: string) => void;
}

export const ChanColumn: React.FC<Props> = ({ loginResponse, setCurrentPage }) => {
    const navigate = useNavigate();

    const handleFriendsClick = () => {
        // Use a timestamp as a refresh key
        setCurrentPage("friends", Date.now());
    };

    const handleSettingClick = () => {
        navigate("/settings");
    };

    const putAvatar = () => {
        if (loginResponse?.avatarUrl) {
            return (
                <>
                    <span className="avatar bg-greyple mt-6">
                        <img
                            className="rounded-full"
                            src={loginResponse.avatarUrl}
                            alt="avatar"
                        />
                    </span>
                </>
            );
        } else {
            return (
                <>
                    <span className="avatar bg-greyple mt-6">
                        <img
                            className="rounded-full"
                            src={defaultAvatar}
                            alt="avatar"
                        />
                    </span>
                </>
            );
        }
    };

    return (
        <div className="bg-not-quite-black chan-column">
            <div
                className="bg-not-quite-black topbar-section border-b border-b-almost-black "
                style={{ borderBottomWidth: "3px" }}
            ></div>
            <div className="w-full item-center justify-center">
                <div className="cell-chan text-xl align-center hover:bg-discord-light-grey hover:rounded-lg">
                    <svg
                        aria-hidden="true"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        width="35"
                        height="35"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"
                        ></path>
                        <path
                            fill="currentColor"
                            d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        ></path>
                    </svg>
                    <div className="ml-6 mt-1">
                        <button onClick={handleFriendsClick}>Amis</button>
                    </div>
                </div>
            </div>
            <div className="cell-chan  font-bold text-greyple hover:text-white hover:rounded-md text-sm text-left flex items-center justify-between">
                <div>MESSAGE PRIVES</div>
                <span className="bloc text-right">+</span>
            </div>
            <div className="bg-almost-black text-m user-chancolumn">
                {putAvatar()}
                <span className=" font-bold mt-3"> {loginResponse?.username} </span>
                <span className="text-greyple">En ligne</span>
                <button onClick={handleSettingClick}>setting</button>
            </div>
        </div>
    );
};

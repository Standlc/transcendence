import { useState } from "react";
import { Avatar } from "../UIKit/avatar/Avatar";
import MoreVertIcon from "@mui/icons-material/MoreVert";

interface Popuser {
    user: {
        userId: number;
        avatarUrl: string;
        username: string;
        rating: number;
        status: number;
    };
    onClose: () => void;
}

export const UserPopup: React.FC<Popuser> = ({ user, onClose }: Popuser) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        // Adjusted class names for full viewport coverage and corrected bg-opacity class
        <div className=" top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-30 z-10">
            <div className="bg-gray-200 w-[600px] h-[650px] rounded-md shadow-lg flex flex-col">
                <div className="flex rounded-top-lg bg-discord-light-black w-full h-[100px]"></div>
                <div className="flex bg-discord-light-grey items-center justify-between w-full p-4">
                    <Avatar
                        imgUrl={user?.avatarUrl}
                        size="2xl"
                        userId={user?.id ?? 0}
                    />
                    <div className="flex items-center gap-2">
                        <div className="bg-green-500 py-2 rounded-lg px-3">
                            <button>Send message</button>
                        </div>
                        <div className="relative">
                            <button onClick={toggleMenu}>
                                <MoreVertIcon />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 top-8 bg-discord-black rounded-lg shadow-md">
                                    <button className="block px-4 text-red-500 py-2 w-full text-left hover:bg-discord-light-grey">
                                        Delete
                                    </button>
                                    <button className="block px-4 py-2 w-full text-left hover:bg-discord-light-grey">
                                        Send Message
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 bg-discord-light-grey p-4">
                    <div className="bg-discord-black p-4 rounded-lg">
                        <div className="text-xl font-bold">
                            <div>{user?.username}</div>
                            <div>elo: {user?.rating}</div>
                            <div>{user?.bio}</div>
                        </div>
                    </div>
                    <button className="mt-4" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

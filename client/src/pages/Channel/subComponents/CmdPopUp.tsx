import { Avatar } from "../../../UIKit/avatar/Avatar";
import { CreateChannelResponse, ChannelUser } from "../../../types/channel";

interface Props {
    onClose: () => void;
    chanInfo: CreateChannelResponse;
}

export const CmdOpen: React.FC<Props> = ({ onClose, chanInfo }) => {
    const doCmd = (cmd: string) => {
        if (cmd === "kick") {
            console.log("Confirmed:", cmd);
            onClose();
        }
        if (cmd === "ban") {
            console.log("Confirmed:", cmd);
            onClose();
        }
        if (cmd === "mute") {
            console.log("Confirmed:", cmd);
            onClose();
        }
    };

    return (
        <div className="top-0 left-0 w-full h-full flex justify-center items-center bg-discord-light-grey bg-opacity-30 z-10">
            <div className="bg-discord-light-grey w-[500px] h-[550px] rounded-md shadow-lg flex flex-col">
                <div className="mt-10 text-2xl font-bold">Kick</div>
                {/* Afficher les utilisateurs */}
                <div className="mt-5 h-[500px] overflow-y-auto">
                    <ul>
                        {chanInfo.users.map((user: ChannelUser) => (
                            <li key={user.userId}>
                                <div className="flex justify-between items-center hover:bg-discord-light-black mr-5 ml-5 rounded-lg p-2">
                                    <div className="flex items-center">
                                        <div className="ml-4 mt-2">
                                            <Avatar
                                                imgUrl={user.avatarUrl}
                                                size="md"
                                                userId={user.userId}
                                                status={user.status}
                                                borderRadius={0.5}
                                            />
                                        </div>
                                        <div className="font-bold text-center ml-[20px]">
                                            {user.username}
                                        </div>
                                    </div>

                                    <div className="mr-[5px]">
                                        <button
                                            onClick={() => doCmd("kick")}
                                            className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-700 mr-5"
                                        >
                                            Kick
                                        </button>
                                        <button
                                            onClick={() => doCmd("ban")}
                                            className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-700 mr-5"
                                        >
                                            Ban
                                        </button>
                                        <button
                                            onClick={() => doCmd("mute")}
                                            className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-700 mr-5"
                                        >
                                            Mute
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="fixed mt-[450px] ml-[220px] ">
                    <button
                        className="mt-4 w-[100px] px-4 py-2 bg-blurple text-white rounded hover:bg-blurple-hover mr-5"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

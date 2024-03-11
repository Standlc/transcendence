import { useParams } from "react-router-dom";
import { NotificationBox } from "../components/NotificationBox";
import { useEffect, useState } from "react";
import { CreateChannelResponse } from "../types/channel";
import TextArea from "../UIKit/TextArea";
import { Avatar } from "../UIKit/avatar/Avatar";

export const Channel = () => {
    const { channelId } = useParams();
    const [chanInfo, setChanInfo] = useState<CreateChannelResponse>({});
    const [textAreaValue, setTextAreaValue] = useState("");

    const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextAreaValue(event.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const getChannel = async (channelId: string) => {
        try {
            const response = await fetch(`/api/channels/${channelId}/channel`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Channel data:", data);
                setChanInfo(data);
                console.log("Channel info:", chanInfo);
            } else {
                console.error("Request failed ", response.status);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    useEffect(() => {
        if (channelId) {
            getChannel(channelId);
        }
    }, [channelId]);

    const sendMessage = () => {
        // if (textAreaValue.trim() && dmId && socketRef.current) {
        //     const messageData = {
        //         content: textAreaValue,
        //         conversationId: dmId,
        //         senderId: user?.id,
        //     };
        //     socketRef.current.emit("createDirectMessage", messageData);
        setTextAreaValue("");
    };

    return (
        <div
            className="w-full bg-discord-light-grey flex flex-col"
            style={{ height: "100vh" }}
        >
            <div
                className="bg-discord-greyple topbar-section border-b border-b-almost-black"
                style={{ borderBottomWidth: "3px" }}
            >
                <div className="w-full flex justify-between items-center ">
                    <div className="w-full flex ">
                        <div className="flex item-center  ml-[20px]">
                            <Avatar
                                imgUrl={chanInfo.photoUrl}
                                size="md"
                                userId={chanInfo.id ?? 0}
                                borderRadius={0.5}
                            />
                        </div>
                        <div className="ml-2 mt-2 font-bold text-xl">
                            <button>{chanInfo.name}</button>
                            <span className="ml-[20px]">|</span>
                        </div>
                        <div className="ml-5 mt-2 text-xl">
                            <div>USERS</div>
                        </div>
                    </div>
                    <div>
                        <NotificationBox />
                    </div>
                </div>
            </div>
            <div className="bg-discord-dark-grey mt-auto p-2 rounded-lg ml-5 mr-5 mb-5">
                <TextArea
                    value={textAreaValue}
                    onChange={handleTextAreaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type something..."
                    autoFocus={true}
                />
            </div>
        </div>
    );
};

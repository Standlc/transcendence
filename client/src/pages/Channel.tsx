import { useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ChannelMessages, CreateChannelResponse } from "../types/channel";
import TextArea from "../UIKit/TextArea";
import { Avatar } from "../UIKit/avatar/Avatar";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ModalLayout from "../UIKit/ModalLayout";
import { CmdOpen } from "./Channel/subComponents/CmdPopUp";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChannelMessage } from "@api/types/schema";
import { forEach } from "lodash";

export const Channel = () => {
    const { channelId } = useParams();
    const queryClient = useQueryClient();

    const [textAreaValue, setTextAreaValue] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    const [cmdOpen, setCmdOpen] = useState(false);
    const { chatSocket } = useContext(SocketsContext);


    const allMessagesChan = useQuery<ChannelMessages[]>({
        queryKey: ["allMessagesChan", channelId],
        queryFn: async () => {
            if (!channelId) {
                return [];
            }
            const response = await axios.get(`/api/channels/${channelId}/messages`);
            return response.data;
        },
        enabled: !!channelId,
    });

    const chanInfo = useQuery<CreateChannelResponse>({
        queryKey: ["chanInfo", channelId],
        queryFn: async () => {
            const response = await axios.get(`/api/channels/${channelId}/channel`);
            console.log(response.data);
            return response.data;
        },
    });


    const findUserById = (newMessage : ChannelMessage) => {
        console.log("newMESSAGE", newMessage.content);
        if (chanInfo.data?.users) {
            for (const user of chanInfo.data.users) {
                if (user.userId === newMessage.senderId) {
                    console.log("USER", user);
                    return user;
                }
            }
        }
        console.log("NULLLLLL");
        return null;
    }
    


    useEffect(() => {
      
        if (!channelId) return;
    
        chatSocket.emit("joinChannel", { channelId });
        
        chatSocket.on("message", (data) => {
            console.log("message" + data);
        });
    
        chatSocket.on("joinChannel", () => {
            console.log("Connected to Channel");
        });
    
        const handleMessageCreation = (newMessage: ChannelMessage) => {
            console.log("newMessage", newMessage);
            if (!chanInfo.data) return;
    
            const messageUser = findUserById(newMessage);
            const pushedMessage: ChannelMessages = {
                avatarUrl: messageUser?.avatarUrl ?? null,
                channelId: newMessage.channelId,
                messageContent: newMessage.content,
                senderId: newMessage.senderId,
                createdAt: newMessage.createdAt,
            };
    
            queryClient.setQueryData<ChannelMessages[]>(
                ["allMessagesChan", channelId],
                (prev) => [...prev ? prev : [], pushedMessage]
            );
        };
    
        chatSocket.on("createChannelMessage", handleMessageCreation);
    
        return () => {
            chatSocket.off("message");
            chatSocket.off("joinChannel");
            chatSocket.off("createChannelMessage", handleMessageCreation);
        };
    }, [channelId, chatSocket, queryClient, chanInfo.data]); 
    

    const sendMessage = () => {
        if (textAreaValue.trim() && channelId) {
            const messageData = {
                content: textAreaValue,
                channelId: channelId,
            };
    
            chatSocket.emit("createChannelMessage", messageData);
            setTextAreaValue(""); 
        }
    }

    const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextAreaValue(event.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
           
            sendMessage();
        }
    };


    // const ShowAdminButton = () => {
    //     return (
    //         <div className="flex items-center">
    //             <div onClick={() => setCmdOpen(true)} className="text-white">
    //                 <MoreVertIcon />
    //             </div>
    //             <div>
    //                 {cmdOpen && (
    //                     <ModalLayout>
    //                         <CmdOpen
    //                             onClose={() => setCmdOpen(false)}
    //                             chanInfo={chanInfo}
    //                         />
    //                     </ModalLayout>
    //                 )}
    //             </div>
    //         </div>
    //     );
    // };
    

    const shouldDisplayAvatarAndTimestamp = (currentIndex: number): boolean => {
        if (currentIndex === 0 || !allMessagesChan.data) {
            return true;
        }

        const previousMessage = allMessagesChan.data[currentIndex - 1];
        const currentMessage = allMessagesChan.data[currentIndex];

        return previousMessage.senderId !== currentMessage.senderId;
    };

    const shouldDisplayUsername = (currentIndex: number): boolean => {
        if (currentIndex === 0 || !allMessagesChan.data) {
            return true;
        }

        const previousMessage = allMessagesChan.data[currentIndex - 1];
        const currentMessage = allMessagesChan.data[currentIndex];

        return previousMessage.senderId !== currentMessage.senderId;
    };
    
    const renderMessages = () => {
        if (allMessagesChan.isLoading || allMessagesChan.isError || !Array.isArray(allMessagesChan.data)) {
            return <div>Loading messages...</div>;
        }
    
        return allMessagesChan.data.map((msg, index) => (
            <div className="message" key={index}>
                <div className="mt-[20px]" key={index}>
                    <div className="flex">
                        {shouldDisplayAvatarAndTimestamp(index) && (
                            <div className="flex">
                                <Avatar
                                    imgUrl={msg.avatarUrl}
                                    userId={msg.senderId}
                                    size="md"
                                    borderRadius={0.5}
                                />
                                {shouldDisplayUsername(index) && (
                                    <div className="font-bold ml-[30px]">
                                        {msg.username}
                                    </div>
                                )}
                            </div>
                        )}
    
                        {shouldDisplayAvatarAndTimestamp(index) && (
                            <div className="ml-[10px] mt-[4px] text-[13px]">
                                {new Date(msg.createdAt).toLocaleString(undefined, {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                })}
                            </div>
                        )}
                    </div>
                    <div className="mt-[-15px] block text-md ml-[80px] hover:bg-discord-dark-grey ">
                        {msg.messageContent}
                    </div>
                </div>
            </div>
        ));
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
                                imgUrl={chanInfo.data?.photoUrl}
                                size="md"
                                userId={chanInfo.data?.id ?? 0}
                                borderRadius={0.5}
                            />
                        </div>
                        <div className="ml-2 mt-2 font-bold text-xl">
                            <button>{chanInfo.data?.name}</button>
                            <span className="ml-[20px]">|</span>
                        </div>
                        <div className="ml-5 mt-2 text-xl">
                            <div>USERS</div>
                        </div>
                    </div>
                    <div>
                        {/* <button onClick={toggleMenu}>
                            <ShowAdminButton />
                        </button> */}
                    </div>
                </div>
            </div>
            
            <div className="text-white text-left h-[750px] w-auto ml-[20px] overflow-auto">
                {renderMessages()}
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

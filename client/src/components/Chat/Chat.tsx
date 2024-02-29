import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../RequireAuth/AuthProvider";

interface Props {
    SERVER_URL: string;
    conversationID: number | null;
    selectedFriend: { id: number; username: string } | null;
}

const Chat: React.FC<Props> = ({
    conversationID,
    selectedFriend,
    SERVER_URL,
}: Props) => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Array<{ userId: number; text: string }>>(
        []
    );
    const { loginResponse } = useAuth();
    const socketRef = useRef<any>(null);

    useEffect(() => {
        if (conversationID) {
            console.log(
                "Setting up socket connection for conversationID",
                conversationID
            );
            socketRef.current = io(SERVER_URL);
            console.log("SOCKET", socketRef.current);

            socketRef.current.emit("joinConversation", {
                conversationId: conversationID,
                userId: loginResponse?.id,
            });

            socketRef.current.on(
                "newMessage",
                (message: { userId: number; text: string }) => {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            );

            return () => {
                socketRef.current.disconnect();
            };
        }
    }, [conversationID]);

    useEffect(() => {
        const getFullConversation = async () => {
            if (!conversationID) return;

            try {
                const response = await fetch(
                    `http://localhost:3000/api/dm/${conversationID}/messages`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // Assuming the API response is directly in the format we need
                setMessages(data);
            } catch (error) {
                console.error("Fetching conversation failed:", error);
            }
        };

        getFullConversation();
        console.log("MESSAGES", messages);
    }, [conversationID]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (message.trim() && conversationID && socketRef.current) {
            const messageData = {
                content: message,
                conversationId: conversationID,
                senderId: loginResponse?.id,
            };
            console.log("Sending message", messageData);
            socketRef.current.emit("createDirectMessage", messageData);
            setMessage("");
        }
    };

    if (!conversationID) {
        return <div>Please select a conversation to start chatting.</div>;
    }

    return (
        <div className="w-full">
            <div
                className="bg-discord-greyple topbar-section border-b border-b-almost-black"
                style={{ borderBottomWidth: "3px" }}
            >
                {selectedFriend?.username}
            </div>
            <div className="text-black h-[800px] w-[1400px] ml-[20px]">
                {messages.map((msg, index) => (
                    <div key={index}>
                        <b>
                            {msg.userId === loginResponse?.id
                                ? "You"
                                : selectedFriend?.username}
                            :
                        </b>{" "}
                        {msg.text}
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage}>
                <input
                    className="text-black bg-gray h-[40px] w-[1200px] ml-[20px] mt-[20px]"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default Chat;

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css'; // Make sure the path to your CSS file is correct
import { io } from 'socket.io-client';


///////////////////////////////////////////////////////
// Ceci est un brouillon pour m'aider a voir le chat //
///////////////////////////////////////////////////////
const ChatComponent = () => {
  const { id: userId, channelId } = useParams(); // extracting userId and channelId from URL parameters
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('ws://localhost:5000/chat', {
      transports: ['websocket'],
      query: {
        id: userId,
        channelId: channelId,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connection opened');
    });

    newSocket.on('message', (newMessage) => {
      try {
        const jsonStartIndex = newMessage.indexOf('{');
        const jsonEndIndex = newMessage.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          const jsonSubstring = newMessage.substring(jsonStartIndex, jsonEndIndex + 1);
          const parsedMessage = JSON.parse(jsonSubstring);

          parsedMessage.senderId = userId;
          parsedMessage.channelId = channelId;

          console.log('Received message:');
          console.log('Raw:', newMessage); // the raw message
          console.log('Content...:', parsedMessage.content);
          console.log('SenderId...:', parsedMessage.senderId);
          console.log('ChannelId...:', parsedMessage.channelId);

          setMessages((prevMessages) => [...prevMessages, parsedMessage]);
        } else {
          console.error('Received message does not contain valid JSON:', newMessage);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket');
      newSocket.disconnect();
      newSocket.removeAllListeners(); // Remove all event listeners
    };
  }, [userId, channelId]);

  const sendMessage = () => {
    if (socket && socket.connected) {
      const newMessage = { content: inputMessage, channel: 1 };
      socket.emit('message', newMessage);
      setInputMessage('');
    } else {
      console.error('Socket is not connected. Message not sent.');
    }
  };

  return (
    <div>
      <h1>Chat Messages</h1>
      <ul key={messages.length}>
        {messages.map((message, index) => (
          <li key={index}>
            <strong>{message?.senderId}</strong>: {message?.content}
          </li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ color: 'black' }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;

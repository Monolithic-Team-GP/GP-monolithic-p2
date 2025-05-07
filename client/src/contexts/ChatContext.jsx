import { createContext, useEffect, useState } from "react";
import socket from "../socket/socket";

const ChatContext = createContext();

export default ChatContext;

export function ChatProvider({ children }) {
  const [dataBase, setDataBase] = useState([]);
  const [message, setMessage] = useState({
    message: "",
    name: localStorage.getItem("name"),
  });

  function fetchChat() {
    socket.on("history-message", (db) => {
      setDataBase(db);
    });
  }

  useEffect(() => {
    fetchChat();

    return () => {
      socket.off("history-message");
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        dataBase,
        setDataBase,
        message,
        setMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

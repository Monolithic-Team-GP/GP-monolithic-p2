import { createContext, useState } from "react";

const ChatContext = createContext({
  dataBase: [],
  setDataBase: () => {},
  message: {
    message: "",
    name: localStorage.getItem("name") || "",
  },
  setMessage: () => {},
});

export default ChatContext;

export const ChatProvider = ({ children }) => {
  const [dataBase, setDataBase] = useState([]);
  const [message, setMessage] = useState({
    message: "",
    name: localStorage.getItem("name") || "",
  });

  return (
    <ChatContext.Provider
      value={{ dataBase, setDataBase, message, setMessage }}
    >
      {children}
    </ChatContext.Provider>
  );
};

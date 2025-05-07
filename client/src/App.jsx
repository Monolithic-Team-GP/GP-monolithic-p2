import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import Login from "../src/pages/Login";
import ChatPage from "./pages/ChatPage";
import { ChatProvider } from "./contexts/ChatContext";

function App() {
  return (
    <>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chat-page" element={<ChatPage />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </>
  );
}

export default App;

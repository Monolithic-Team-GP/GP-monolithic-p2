import { useState } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/chat" element={<ChatPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

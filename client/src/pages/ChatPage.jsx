import { useContext, useEffect, useState } from "react";
import socket from "../socket/socket";
import { useNavigate } from "react-router";
import ChatContext from "../contexts/ChatContext";

export default function ChatPage() {
  const { dataBase, setDataBase, message, setMessage } =
    useContext(ChatContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("name")) {
      navigate("/");
    }
    findUser();
    return () => {
      socket.off("history-message");
      socket.off("message");
    };
  }, []);

  function findUser() {
    socket.auth = {
      name: localStorage.getItem("name"),
    };
    socket.disconnect().connect();
  }

  function fetchChat() {
    socket.on("history-message", (db) => {
      setDataBase(db);
    });
  }

  function sendMessage(e) {
    e.preventDefault();
    try {
      socket.emit("message", message);

      setTimeout(() => {
        setMessage({
          message: "",
          name: localStorage.getItem("name"),
        });
      }, 300);
    } catch (error) {
      console.log("🚀 ~ sendMessage ~ error:", error);
    }
  }

  function change(e) {
    setMessage({ ...message, [e.target.name]: e.target.value });
  }

  useEffect(() => {
    socket.on("public-moderation-warning", (data) => {
      const warningElement = document.createElement("div");
      warningElement.className = "moderation-warning";
      warningElement.innerHTML = `
        <strong>Moderation Notice:</strong> 
        Peringatan untuk ${data.userName} karena melanggar aturan aplikasi.
        <p class="warning-message">${data.warning}</p>
      `;

      const chatContainer = document.querySelector(".chat-container");
      chatContainer.appendChild(warningElement);

      chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    return () => {
      socket.off("public-moderation-warning");
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#36393f] text-white">
      {/* Sidebar: User List */}
      <aside className="w-64 bg-[#23272a] p-4 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Pengguna Online</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-500 rounded-full" />
            <span className="text-sm">pengguna1</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full" />
            <span className="text-sm">pengguna2</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full" />
            <span className="text-sm">pengguna3</span>
          </li>
          {/* Tambahkan lebih banyak user di sini */}
        </ul>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 bg-[#2c2f33] border-b border-[#202225] flex items-center justify-between shadow-md">
          <h1 className="text-2xl font-semibold">Grup Chat</h1>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#7289da] hover:bg-[#5b6eae] text-white rounded-md font-medium transition"
            onClick={() => alert("Voice call diaktifkan! (simulasi)")}
          >
            🎤 Voice Call
          </button>
        </header>

        {/* Messages Area */}
        <section className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#36393f] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat chat-container">
          {/* Incoming Message */}
          {dataBase.map((el) => {
            return (
              <div key={el.id}>
                {el.name === localStorage.getItem("name") ? (
                  <div className="flex justify-end">
                    <div className="bg-[#7289da] p-3 rounded-lg max-w-md text-white">
                      <p className="text-sm font-semibold">{el.name}</p>
                      <p className="text-sm">{el.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
                    <div className="bg-[#40444b] p-3 rounded-lg max-w-md">
                      <p className="text-sm font-semibold">{el.name}</p>
                      <p className="text-sm text-gray-200">{el.message}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Outgoing Message */}
        </section>

        {/* Chat Input */}
        <footer className="bg-[#40444b] p-4 shadow-inner">
          <form className="flex items-center gap-2" onSubmit={sendMessage}>
            {/* Upload Button */}
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex items-center justify-center w-10 h-10 bg-[#2f3136] hover:bg-[#36393f] text-gray-300 rounded-md transition"
            >
              📎
            </label>
            <input id="file-upload" type="file" className="hidden" />

            {/* Text Input */}
            <input
              name="message"
              value={message.message}
              onChange={change}
              type="text"
              placeholder="Ketik pesan..."
              className="flex-1 px-4 py-2 rounded-md bg-[#2f3136] text-white focus:outline-none focus:ring-2 focus:ring-[#7289da]"
            />

            {/* Send Button */}
            <button
              type="submit"
              className="px-4 py-2 bg-[#7289da] hover:bg-[#5b6eae] text-white font-semibold rounded-md"
            >
              Kirim
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

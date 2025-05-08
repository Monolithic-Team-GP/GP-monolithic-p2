import { useEffect, useState } from "react";
import socket from "../socket/socket";

export default function SideBar() {
  const [userOnline, setUserOnline] = useState([]);

  useEffect(() => {
    findUser();
    socket.emit("user-login", "input-data-user");
    socket.on("data-user-online", (dbUser) => {
      setUserOnline(dbUser);
    });
    return () => {
      socket.off("user-login");
      socket.off("data-user-online");
    };
  }, []);

  function findUser() {
    socket.auth = {
      name: localStorage.getItem("name"),
    };
    socket.disconnect().connect();
  }

  return (
    <aside className="w-72 bg-gradient-to-b from-indigo-900/90 to-purple-900/90 backdrop-blur-md border-r border-white/10 shadow-xl flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200">
          Chat Room
        </h2>
        <p className="text-sm text-purple-200/70">Pengguna Online</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-1">
          {userOnline.map((name, i) => {
            const isCurrentUser = name === localStorage.getItem("name");
            const initial =
              name && name.charAt(0) ? name.charAt(0).toUpperCase() : "?";

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isCurrentUser
                    ? "bg-white/10 border border-white/10 shadow-md"
                    : "hover:bg-white/5"
                }`}
              >
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md
                  ${
                    isCurrentUser
                      ? "bg-gradient-to-br from-pink-500 to-purple-600"
                      : "bg-gradient-to-br from-indigo-600 to-purple-700"
                  }
                `}
                >
                  {initial}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-medium ${
                      isCurrentUser ? "text-purple-200" : "text-white"
                    }`}
                  >
                    {name}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-purple-300/70">You</span>
                  )}
                </div>

                <div className="ml-auto">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-md">
            {localStorage.getItem("name")?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-purple-200">
              {localStorage.getItem("name")}
            </span>
            <span className="text-xs text-purple-300/70">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

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
    <>
      <aside className="w-64 bg-[#23272a] p-4 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Pengguna Online</h2>
        <ul className="space-y-3">
          {userOnline.map((name, i) => {
            return (
              <li key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-500 rounded-full" />
                <span className="text-sm">{name}</span>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}

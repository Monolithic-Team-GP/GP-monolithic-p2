import { useContext, useEffect, useState, useRef } from "react";
import socket from "../socket/socket";
import { useNavigate } from "react-router";
import ChatContext from "../contexts/ChatContext";
import Swal from "sweetalert2";
import SideBar from "../components/SideBar";

export default function ChatPage() {
  const { dataBase, setDataBase, message, setMessage } =
    useContext(ChatContext);

  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [users, setUsers] = useState([]);
  const [otherUser, setOtherUser] = useState();

  const ROOM_ID = "room-1";
  const peerConnectionsRef = useRef({});
  const audioRefs = useRef({});
  const localStreamRef = useRef(null);
  const iceCandidateBufferRef = useRef({});
  const chatContainerRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    socket.off("call-user");
  };

  useEffect(() => {
    if (!localStorage.getItem("name")) {
      navigate("/");
    }
    fetchChat();

    return () => {
      socket.off("history-message");
      socket.off("message");
      socket.off("error");
    };
  }, []);

  function fetchChat() {
    socket.on("history-message", (db) => {
      console.log("Received message history:", db);
      setDataBase(db);
    });

    socket.on("error", (errorMsg) => {
      console.error("Socket error:", errorMsg);
      alert("Error: " + errorMsg);
    });

    socket.on("data-user-online", (data) => {
      setOtherUser(data);
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

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      Swal.fire({
        icon: "error",
        text: "please choose your file",
      });
      return;
    }

    setIsUploading(true);

    const img = new Image();
    const reader = new FileReader();

    reader.onload = function (e) {
      img.src = e.target.result;

      img.onload = function () {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const maxDim = 1000;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);

        console.log(
          "Original size (approx):",
          Math.round(file.size / 1024),
          "KB"
        );
        console.log(
          "Compressed size (approx):",
          Math.round(compressedDataUrl.length / 1.37 / 1024),
          "KB"
        );

        socket.emit("image", {
          url: compressedDataUrl,
          userId: localStorage.getItem("name"),
          name: localStorage.getItem("name"),
        });
      };
    };

    reader.readAsDataURL(file);
  }

  useEffect(() => {
    socket.emit("join-room", ROOM_ID);

    socket.on("chat message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("room-users", (userIds) => {
      setUsers(userIds);
      userIds.forEach((userId) => {
        if (userId !== socket.id && !peerConnectionsRef.current[userId]) {
          createPeerConnection(userId);
        }
      });
    });

    socket.on("user-joined", (userId) => {
      if (userId !== socket.id && !peerConnectionsRef.current[userId]) {
        createPeerConnection(userId);
      }
    });

    socket.on("user-left", (userId) => {
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }
      if (audioRefs.current[userId]) {
        audioRefs.current[userId].srcObject = null;
        delete audioRefs.current[userId];
      }
      setUsers((prev) => prev.filter((u) => u !== userId));
    });

    socket.on("call-made", async ({ offer, caller }) => {
      await setupMediaStream();
      const pc = peerConnectionsRef.current[caller];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      if (iceCandidateBufferRef.current[caller]) {
        while (iceCandidateBufferRef.current[caller].length > 0) {
          const candidate = iceCandidateBufferRef.current[caller].shift();
          await pc.addIceCandidate(candidate);
        }
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("make-answer", { answer, target: caller });
      setCallActive(true);
    });

    socket.on("answer-made", async ({ answer, answerer }) => {
      const pc = peerConnectionsRef.current[answerer];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      if (iceCandidateBufferRef.current[answerer]) {
        while (iceCandidateBufferRef.current[answerer].length > 0) {
          const candidate = iceCandidateBufferRef.current[answerer].shift();
          await pc.addIceCandidate(candidate);
        }
      }
    });

    socket.on("ice-candidate", async ({ candidate, from }) => {
      const pc = peerConnectionsRef.current[from];
      if (!pc) return;
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        if (!iceCandidateBufferRef.current[from])
          iceCandidateBufferRef.current[from] = [];
        iceCandidateBufferRef.current[from].push(
          new RTCIceCandidate(candidate)
        );
      }
    });

    const createPeerConnection = (userId) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStreamRef.current));
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            target: userId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        let audio = audioRefs.current[userId];
        if (!audio) {
          audio = document.createElement("audio");
          audio.id = `audio-${userId}`;
          audio.autoplay = true;
          audio.playsInline = true;
          audioRefs.current[userId] = audio;
          document.body.appendChild(audio);
        }
        audio.srcObject = event.streams[0];
      };

      peerConnectionsRef.current[userId] = pc;
    };

    socket.on("image", (data) => {
      console.log("🚀 ~ socket.on ~ data:", data.url);
      setIsUploading(false);

      setDataBase((prev) => {
        const newDB = [
          ...prev,
          {
            id: prev.length ? prev.length + 1 : 1,
            name: data.name,
            message: null,
            imageUrl: data.url,
            isImage: true,
          },
        ];

        return newDB;
      });
    });

    socket.on("error", () => {
      setIsUploading(false);
    });

    return () => {
      socket.off("image");
      socket.off("error");
      socket.off("chat message");
      socket.off("room-users");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("call-made");
      socket.off("answer-made");
      socket.off("ice-candidate");
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [dataBase]);

  const setupMediaStream = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = stream;
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        });
        return true;
      } catch (error) {
        alert("Unable to access microphone");
        return false;
      }
    }
    return true;
  };

  const startGroupCall = async () => {
    const ok = await setupMediaStream();
    if (!ok) return;
    for (const userId of users) {
      if (userId !== socket.id) {
        const pc = peerConnectionsRef.current[userId];
        if (!pc) continue;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call-user", { offer, target: userId });
      }
    }
    setCallActive(true);
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      if (pc) pc.close();
    });
    peerConnectionsRef.current = {};

    Object.keys(audioRefs.current).forEach((userId) => {
      const audio = audioRefs.current[userId];
      if (audio) {
        audio.srcObject = null;
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      }
    });
    audioRefs.current = {};

    setCallActive(false);
    socket.emit("leave-call", ROOM_ID);
    toggleModal();
  };

  const renderAudioElements = () => {
    return users
      .filter((u) => u !== socket.id)
      .map((userId) => (
        <audio
          key={userId}
          id={`audio-${userId}`}
          autoPlay
          playsInline
          ref={(el) => {
            if (el) audioRefs.current[userId] = el;
          }}
        />
      ));
  };

  function leave() {
    socket.emit("leave", localStorage.getItem("name"));
    localStorage.removeItem("name");
    navigate("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <SideBar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 bg-black/30 backdrop-blur-sm border-b border-white/10 flex items-center justify-between shadow-lg">
          <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
            Grup Chat
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                toggleModal();
                startGroupCall();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-md font-medium transition shadow-md hover:shadow-lg"
            >
              🎤 Voice Call
            </button>
            <button
              onClick={() => {
                leave();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-md font-medium transition shadow-md hover:shadow-lg"
            >
              Leave
            </button>
          </div>
        </header>

        {renderAudioElements()}

        <section
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20 backdrop-blur-sm chat-container"
        >
          {dataBase.map((el) => {
            return (
              <div key={el.id} className="animate-fadeIn">
                {el.name === localStorage.getItem("name") ? (
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl rounded-tr-sm max-w-md text-white shadow-lg">
                      <p className="text-sm font-semibold text-purple-200">
                        {el.name}
                      </p>
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt="Shared image"
                          className="max-w-full rounded-lg mt-2 border border-purple-300/30"
                          style={{ maxHeight: "200px" }}
                        />
                      ) : (
                        <p className="text-base">{el.message}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-lg font-bold">
                      {el.name && el.name.charAt(0)
                        ? el.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl rounded-tl-sm max-w-md shadow-lg border border-white/10">
                      <p className="text-sm font-semibold text-purple-300">
                        {el.name || "Unknown User"}
                      </p>
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt="Shared image"
                          className="max-w-full rounded-lg mt-2 border border-white/20"
                          style={{ maxHeight: "200px" }}
                        />
                      ) : (
                        <p className="text-base text-gray-100">{el.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <footer className="bg-black/30 backdrop-blur-sm p-4 shadow-lg border-t border-white/10">
          <form className="flex items-center gap-3" onSubmit={sendMessage}>
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex items-center justify-center w-10 h-10 bg-indigo-900/60 hover:bg-indigo-700 text-purple-200 rounded-full transition shadow-md"
            >
              📎
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            {isUploading && (
              <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 text-center animate-pulse z-50">
                Compressing and uploading image... Please wait
              </div>
            )}

            <input
              name="message"
              value={message.message}
              onChange={change}
              type="text"
              placeholder="Ketik pesan..."
              className="flex-1 px-4 py-3 rounded-full bg-white/10 text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/15 border border-white/10"
            />

            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition"
            >
              Kirim
            </button>
          </form>
        </footer>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-2xl w-full max-w-md border border-white/10">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200">
                  Voice Call
                </h2>
                <button
                  onClick={toggleModal}
                  className="text-purple-300 hover:text-white transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                <p
                  className={`text-center mb-6 text-lg ${
                    callActive ? "text-green-400" : "text-purple-200"
                  }`}
                >
                  {callActive ? "Panggilan Aktif" : "Memulai Panggilan..."}
                </p>

                <h3 className="text-purple-200 font-medium mb-3">
                  Pengguna dalam Panggilan:
                </h3>
                <ul className="space-y-2">
                  {otherUser.map((name, idx) => (
                    <li
                      key={idx}
                      className="bg-white/10 p-3 rounded-lg text-base border border-white/5 shadow-sm"
                    >
                      {socket.auth.name === name
                        ? `${socket.auth.name} (Anda)`
                        : name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between p-5 border-t border-white/10">
                <button
                  onClick={endCall}
                  className="px-5 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg shadow-md hover:shadow-lg transition"
                >
                  Akhiri Panggilan
                </button>
                <button
                  onClick={toggleModal}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg shadow-md hover:shadow-lg transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

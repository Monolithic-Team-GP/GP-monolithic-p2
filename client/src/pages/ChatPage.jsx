import { useContext, useEffect, useState, useRef, use } from "react";
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
    <div className="flex h-screen overflow-hidden bg-[#36393f] text-white">
      <SideBar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 bg-[#2c2f33] border-b border-[#202225] flex items-center justify-between shadow-md">
          <h1 className="text-2xl font-semibold">Grup Chat</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toggleModal();
                startGroupCall();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7289da] hover:bg-[#5b6eae] text-white rounded-md font-medium transition"
            >
              🎤 Voice Call
            </button>
            <button
              onClick={() => {
                leave();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[oklch(55.5%_0.163_48.998)] hover:bg-[oklch(48.8%_0.243_264.376)] text-white rounded-md font-medium transition"
            >
              Leave
            </button>
          </div>
        </header>

        {renderAudioElements()}

        <section className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#36393f] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat chat-container">
          {dataBase.map((el) => {
            return (
              <div key={el.id}>
                {el.name === localStorage.getItem("name") ? (
                  <div className="flex justify-end">
                    <div className="bg-[#7289da] p-3 rounded-lg max-w-md text-white">
                      <p className="text-sm font-semibold">{el.name}</p>
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt="Shared image"
                          className="max-w-full rounded mt-2"
                          style={{ maxHeight: "200px" }}
                        />
                      ) : (
                        <p className="text-sm">{el.message}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
                    <div className="bg-[#40444b] p-3 rounded-lg max-w-md">
                      <p className="text-sm font-semibold">{el.name}</p>
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt="Shared image"
                          className="max-w-full rounded mt-2"
                          style={{ maxHeight: "200px" }}
                        />
                      ) : (
                        <p className="text-sm text-gray-200">{el.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <footer className="bg-[#40444b] p-4 shadow-inner">
          <form className="flex items-center gap-2" onSubmit={sendMessage}>
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex items-center justify-center w-10 h-10 bg-[#2f3136] hover:bg-[#36393f] text-gray-300 rounded-md transition"
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
              <div className="fixed top-0 left-0 right-0 bg-[#7289da] text-white p-2 text-center animate-pulse">
                Compressing and uploading image... Please wait
              </div>
            )}

            <input
              name="message"
              value={message.message}
              onChange={change}
              type="text"
              placeholder="Ketik pesan..."
              className="flex-1 px-4 py-2 rounded-md bg-[#2f3136] text-white focus:outline-none focus:ring-2 focus:ring-[#7289da]"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-[#7289da] hover:bg-[#5b6eae] text-white font-semibold rounded-md"
            >
              Kirim
            </button>
          </form>
        </footer>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#36393f] rounded-lg shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-[#202225]">
                <h2 className="text-lg font-semibold text-white">Voice Call</h2>
                <button
                  onClick={toggleModal}
                  className="text-gray-400 hover:text-white"
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
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <p
                  className={`text-center mb-4 ${
                    callActive ? "text-green-500" : "text-white"
                  }`}
                >
                  {callActive ? "Panggilan Aktif" : "Memulai Panggilan..."}
                </p>

                <h3 className="text-white font-medium mb-2">
                  Pengguna dalam Panggilan:
                </h3>
                <ul className="space-y-2">
                  {otherUser.map((name, idx) => (
                    <li key={idx} className="bg-[#2f3136] p-2 rounded text-sm">
                      {socket.auth.name === name
                        ? `${socket.auth.name} (Anda)`
                        : name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between p-4 border-t border-[#202225]">
                <button
                  onClick={endCall}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Akhiri Panggilan
                </button>
                <button
                  onClick={toggleModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
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

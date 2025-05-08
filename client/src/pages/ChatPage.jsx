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

  // NEW vv

  const ROOM_ID = "room-1"; // Bisa diganti dinamis

  // Untuk group call, simpan peerConnection per userId
  const peerConnectionsRef = useRef({});
  // Simpan audio ref per userId
  const audioRefs = useRef({});
  // Simpan local stream
  const localStreamRef = useRef(null);
  // Simpan ICE candidate buffer per user
  const iceCandidateBufferRef = useRef({});

  // NEW ^^

  // Tambahkan state untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fungsi untuk toggle modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
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
    // NEW vv

    socket.emit("join-room", ROOM_ID);

    socket.on("chat message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("room-users", (userIds) => {
      setUsers(userIds);
      // Buat peer connection untuk user baru
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

    // Signaling events
    socket.on("call-made", async ({ offer, caller }) => {
      await setupMediaStream();
      const pc = peerConnectionsRef.current[caller];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      // Proses buffered ICE candidate
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
      // Proses buffered ICE candidate
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

    // Setup local audio stream

    // Membuat peer connection ke userId
    const createPeerConnection = (userId) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Tambahkan local stream jika sudah ada
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
        // Set audio untuk userId ini
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

    // NEW ^^

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

      // NEW

      socket.off("chat message");
      socket.off("room-users");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("call-made");
      socket.off("answer-made");
      socket.off("ice-candidate");
      // Cleanup peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      //NEW
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
        // Tambahkan track ke semua peer connection yang sudah ada
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

  // Mulai group call (panggil semua user lain)
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

  // Render audio element untuk setiap lawan bicara
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#36393f] text-white">
      {/* Sidebar: User List */}
      <SideBar />

      {/* Chat area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 bg-[#2c2f33] border-b border-[#202225] flex items-center justify-between shadow-md">
          <h1 className="text-2xl font-semibold">Grup Chat</h1>
          <button
            onClick={() => {
              toggleModal(); // Buka modal
              // Jangan hapus ini agar tetap menjalankan fungsi panggilan
              startGroupCall();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#7289da] hover:bg-[#5b6eae] text-white rounded-md font-medium transition"
          >
            🎤 Voice Call
          </button>
        </header>

        {renderAudioElements()}

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
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Better upload indicator */}
            {isUploading && (
              <div className="fixed top-0 left-0 right-0 bg-[#7289da] text-white p-2 text-center animate-pulse">
                Compressing and uploading image... Please wait
              </div>
            )}

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
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#36393f] rounded-lg shadow-lg w-full max-w-md">
              {/* Header */}
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

              {/* Body */}
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
                  {users.map((userId) => (
                    <li
                      key={userId}
                      className="bg-[#2f3136] p-2 rounded text-sm"
                    >
                      {userId === socket.id ? `${userId} (Anda)` : userId}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="flex justify-between p-4 border-t border-[#202225]">
                <button
                  onClick={() => {
                    // Tambahkan kode untuk mengakhiri panggilan di sini jika perlu
                    setCallActive(false);
                  }}
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

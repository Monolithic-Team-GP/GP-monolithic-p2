import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Ganti URL sesuai server kamu
const socket = io('https://bde8-139-228-111-119.ngrok-free.app/', {
  extraHeaders: {
    'ngrok-skip-browser-warning': true
  }
});

const ROOM_ID = 'room-1'; // Bisa diganti dinamis

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState('');
  const [callActive, setCallActive] = useState(false);

  // Untuk group call, simpan peerConnection per userId
  const peerConnectionsRef = useRef({});
  // Simpan audio ref per userId
  const audioRefs = useRef({});
  // Simpan local stream
  const localStreamRef = useRef(null);
  // Simpan ICE candidate buffer per user
  const iceCandidateBufferRef = useRef({});

  // Join room & listen events
  useEffect(() => {
    socket.emit('join-room', ROOM_ID);

    socket.on('chat message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on('room-users', (userIds) => {
      setUsers(userIds);
      // Buat peer connection untuk user baru
      userIds.forEach(userId => {
        if (userId !== socket.id && !peerConnectionsRef.current[userId]) {
          createPeerConnection(userId);
        }
      });
    });

    socket.on('user-joined', (userId) => {
      if (userId !== socket.id && !peerConnectionsRef.current[userId]) {
        createPeerConnection(userId);
      }
    });

    socket.on('user-left', (userId) => {
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }
      if (audioRefs.current[userId]) {
        audioRefs.current[userId].srcObject = null;
        delete audioRefs.current[userId];
      }
      setUsers(prev => prev.filter(u => u !== userId));
    });

    // Signaling events
    socket.on('call-made', async ({ offer, caller }) => {
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
      socket.emit('make-answer', { answer, target: caller });
      setCallActive(true);
    });

    socket.on('answer-made', async ({ answer, answerer }) => {
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

    socket.on('ice-candidate', async ({ candidate, from }) => {
      const pc = peerConnectionsRef.current[from];
      if (!pc) return;
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        if (!iceCandidateBufferRef.current[from]) iceCandidateBufferRef.current[from] = [];
        iceCandidateBufferRef.current[from].push(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('chat message');
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');
      // Cleanup peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line
  }, []);

  // Setup local audio stream
  const setupMediaStream = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        // Tambahkan track ke semua peer connection yang sudah ada
        Object.values(peerConnectionsRef.current).forEach(pc => {
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        });
        return true;
      } catch (error) {
        alert("Unable to access microphone");
        return false;
      }
    }
    return true;
  };

  // Membuat peer connection ke userId
  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Tambahkan local stream jika sudah ada
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { target: userId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      // Set audio untuk userId ini
      let audio = audioRefs.current[userId];
      if (!audio) {
        audio = document.createElement('audio');
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
        socket.emit('call-user', { offer, target: userId });
      }
    }
    setCallActive(true);
  };

  // Chat
  const sendMessage = () => {
    if (input.trim() === '') return;
    socket.emit('chat message', input);
    setInput('');
  };

  // Render audio element untuk setiap lawan bicara
  const renderAudioElements = () => {
    return users.filter(u => u !== socket.id).map(userId => (
      <audio key={userId} id={`audio-${userId}`} autoPlay playsInline ref={el => { if (el) audioRefs.current[userId] = el; }} />
    ));
  };

  return (
    <>
      <div>
        <h2>AI Chatroom (Group Voice Call)</h2>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#exampleModal"
          >
            Launch demo modal
          </button>
        </div>

        {renderAudioElements()}

        <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid gray', margin: '10px 0', padding: '10px' }}>
          {messages.map((m, i) => (
            <div key={i}><strong>{m.user || 'User'}:</strong> {m.msg}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{ flexGrow: 1 }}
            placeholder="Type your message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                <button
                  onClick={startGroupCall}
                  disabled={callActive}
                >
                  {callActive ? 'Voice Call Active' : 'Start Group Voice Call'}
                </button>
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              {users.map((userId, index) => (
                <div key={index} className="user-list">
                  <div>{`${userId} ${userId === socket.id ? '(You)' : ''}`}</div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

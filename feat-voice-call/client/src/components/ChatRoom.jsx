import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://02a6-139-228-111-119.ngrok-free.app/', {
  extraHeaders: {
    'ngrok-skip-browser-warning': true
  }
});

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState('');
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioRef = useRef(null);
  const [callActive, setCallActive] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const iceCandidateBufferRef = useRef([]);

  useEffect(() => {
    // Initialize peer connection once
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Chat message handling
    socket.on('chat message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on('users', (data) => {
      setUsers(Object.values(data));
    });

    // WebRTC signaling events
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {

      console.log(event, "<<<s");
      console.log(audioRef, "<<<s");
      
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    // Socket events for signaling
    socket.on('call-made', async (data) => {
      try {
        console.log("Call received from:", data.caller);
        await setupMediaStream();

        iceCandidateBufferRef.current = [];

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log("Remote description set successfully (call-made)");

        while (iceCandidateBufferRef.current.length > 0) {
          const candidate = iceCandidateBufferRef.current.shift();
          try {
            await peerConnectionRef.current.addIceCandidate(candidate);
            console.log("Processed buffered ICE candidate");
          } catch (err) {
            console.error("Error processing buffered candidate:", err);
          }
        }

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit('make-answer', { answer });
        setCallActive(true);
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    });

    socket.on('answer-made', async (data) => {
      try {
        console.log("Answer received from:", data.answerer);
        if (isInitiator && peerConnectionRef.current.signalingState !== "stable") {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log("Remote description set successfully (answer-made)");

          while (iceCandidateBufferRef.current.length > 0) {
            const candidate = iceCandidateBufferRef.current.shift();
            try {
              await peerConnectionRef.current.addIceCandidate(candidate);
              console.log("Processed buffered ICE candidate");
            } catch (err) {
              console.error("Error processing buffered candidate:", err);
            }
          }
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (!data.candidate) return;
      console.log("ICE candidate received from:", data.from);

      try {
        if (peerConnectionRef.current.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log("ICE candidate added successfully");
        } else {
          console.log("Buffering ICE candidate until remote description is set");
          iceCandidateBufferRef.current.push(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error("Error handling ICE candidate:", err);
      }
    });

    return () => {
      socket.off('chat message');
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isInitiator]);

  const setupMediaStream = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        stream.getTracks().forEach(track =>
          peerConnectionRef.current.addTrack(track, stream)
        );

        return true;
      } catch (error) {
        console.error("Error accessing media devices:", error);
        return false;
      }
    }
    return true;
  };

  const callUser = async () => {
    try {
      setIsInitiator(true);

      const mediaReady = await setupMediaStream();
      if (!mediaReady) return;

      iceCandidateBufferRef.current = [];

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit('call-user', { offer });
      setCallActive(true);

      setUsers(prevUsers => {
        return prevUsers.map(user => {
          if (user.id === socket.id) {
            return { ...user, inCall: true };
          }
          return user;
        });
      });

    } catch (error) {
      console.error("Error starting call:", error);
      alert("Could not start call: " + error.message);
    }
  };

  const sendMessage = () => {
    if (input.trim() === '') return;
    socket.emit('chat message', input);
    setInput('');
  };

  return (
    <>
      <div>
        <h2>AI Chatroom</h2>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#exampleModal"
            onClick={() => console.log(users)}
          >
            Launch demo modal
          </button>
        </div>

        <audio ref={audioRef} autoPlay playsInline />

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
                  onClick={callUser}
                  // disabled={callActive}
                >
                  {callActive ? 'Voice Call Active' : 'Start Voice Call'}
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
              {users.map((user, index) => (
                <div key={index} className="user-list">
                  <div>{`${user.id} ${user.inCall ? '(in call)' : ''}`}</div>
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
              <button type="button" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


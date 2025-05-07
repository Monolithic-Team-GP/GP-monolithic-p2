import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://ap-southeast-1.data.tidbcloud.com/api/v1beta/app/dataapp-WDElPzvR/endpoint');

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioRef = useRef(null);
  const [callActive, setCallActive] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);

  useEffect(() => {
    // Initialize peer connection once
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Chat message handling
    socket.on('chat message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // WebRTC signaling events
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    // Socket events for signaling
    socket.on('call-made', async (data) => {
      try {
        // Someone is calling us
        await setupMediaStream();
        
        // Set remote description (from the caller)
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Create answer
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        // Send answer to the caller
        socket.emit('make-answer', { answer });
        setCallActive(true);
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    });

    socket.on('answer-made', async (data) => {
      try {
        // Only the initiator should process answers
        if (isInitiator && peerConnectionRef.current.signalingState !== "stable") {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    socket.on('ice-candidate', (data) => {
      if (data.candidate && peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(err => console.error("Error adding ICE candidate:", err));
      }
    });

    return () => {
      // Cleanup
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

  // Helper function to set up local media
  const setupMediaStream = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        
        // Add tracks to the peer connection
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
      
      // Create and set local description (offer)
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      // Send the offer to the other peer
      socket.emit('call-user', { offer });
      setCallActive(true);
      
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
    <div>
      <h2>AI Chatroom</h2>
      <div>
        <button 
          onClick={callUser}
          disabled={callActive}
        >
          {callActive ? 'Voice Call Active' : 'Start Voice Call'}
        </button>
      </div>

      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />

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
  );
}
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Map(); // Store room data: { users: Set, creator: socketId }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Room management
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Set([socket.id]), creator: socket.id });
    } else {
      rooms.get(roomId).users.add(socket.id);
    }
    
    // Notify room members about new user
    socket.to(roomId).emit('user-joined', socket.id);
    updateRoomUsers(roomId);
  });

  // WebRTC signaling with room-specific routing
  socket.on('call-user', (data) => {
    socket.to(data.target).emit('call-made', { 
      offer: data.offer,
      caller: socket.id,
      room: data.roomId
    });
  });

  socket.on('make-answer', (data) => {
    socket.to(data.target).emit('answer-made', {
      answer: data.answer,
      answerer: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((roomData, roomId) => {
      if (roomData.users.has(socket.id)) {
        roomData.users.delete(socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        updateRoomUsers(roomId);
        
        if (roomData.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });

  function updateRoomUsers(roomId) {
    const roomUsers = Array.from(rooms.get(roomId)?.users || []);
    io.to(roomId).emit('room-users', roomUsers);
  }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

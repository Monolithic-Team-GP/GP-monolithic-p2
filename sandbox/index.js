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

io.on('connection', (socket) => {
  // console.log(socket)
  console.log('a user connected id: ', socket.id);
  
  // Chat message handling
  socket.on('chat message', (msg) => {
    io.emit('chat message', { user: socket.id.substring(0, 4), msg });
  });
  
  // WebRTC signaling
  socket.on('call-user', (data) => {
    // console.log(data)
    socket.broadcast.emit('call-made', { offer: data.offer, caller: socket.id });
  });
  
  socket.on('make-answer', (data) => {
    socket.broadcast.emit('answer-made', { answer: data.answer, answerer: socket.id });
  });
  
  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected : ', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
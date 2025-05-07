const express = require("express");
const app = express();
const PORT = 3000;

const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let dataBase = {
  message: [],
};

io.on("connection", (socket) => {
  socket.on("satu", (tes) => {
    // console.log("🚀 ~ socket.on ~ tes:", tes);
    socket.emit("rtrt", tes);
  });

  socket.on("message", (data) => {
    dataBase.message.push({
      id: dataBase.message.length ? dataBase.message.length + 1 : 1,
      name: data.name,
      message: data.message,
    });
    io.emit("history-message", dataBase.message);
  });
});

httpServer.listen(PORT, () => {
  console.log("Server listening on PORT", PORT);
});

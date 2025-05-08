if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const cloudinary = require("cloudinary").v2;
const express = require("express");
const app = express();
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

app.use(cors());

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const rooms = new Map();

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});
async function moderateContent(text) {
  try {
    const prompt = `
    Analisis teks berikut dan tentukan apakah mengandung kata-kata kasar atau tidak sopan dalam Bahasa Indonesia atau Inggris.
    Berikan respon HANYA dalam format JSON berikut, tanpa teks atau format tambahan:
    {"isSafe": true/false, "censoredText": "teks yang sudah disensor", "warning": "pesan peringatan dalam Bahasa Indonesia jika tidak aman"}

    Teks yang dianalisis: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let aiResponse;

    try {
      aiResponse = JSON.parse(response.text());
    } catch (parseError) {
      const responseText = response.text();
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        return {
          isSafe: true,
          censoredText: text,
          warning: null,
        };
      }
    }

    return aiResponse;
  } catch (error) {
    console.error("Error dalam moderasi AI:", error);
    return {
      isSafe: true,
      censoredText: text,
      warning: null,
    };
  }
}

let dataBase = {
  message: [],
};

let dbUser = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  io.emit("history-message", dataBase.message);

  socket.on("leave", (name) => {
    dbUser = dbUser.filter((user) => user !== name);
    io.emit("data-user-online", dbUser);
  });

  socket.on("user-login", (data) => {
    if (socket.handshake.auth.name) {
      dbUser.push(socket.handshake.auth.name);
    }
    dbUser = [...new Set(dbUser)];
    io.emit("data-user-online", dbUser);
  });

  io.emit("data-user-online", dbUser);

  socket.on("image", async (data) => {
    try {
      const uploadOptions = {
        folder: "chat_images",
        resource_type: "auto",
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      };

      const result = await cloudinary.uploader.upload(data.url, uploadOptions);

      const imageMessage = {
        id: dataBase.message.length ? dataBase.message.length + 1 : 1,
        name: data.name,
        message: "",
        imageUrl: result.secure_url,
        isImage: true,
      };

      dataBase.message.push(imageMessage);

      io.emit("image", {
        url: result.secure_url,
        userId: data.userId,
        name: data.name,
      });
    } catch (error) {
      console.error("Error uploading to cloudinary:", error.message);
      socket.emit("error", "Failed to upload image: " + error.message);
    }
  });

  socket.on("message", async (data) => {
    const moderationResult = await moderateContent(data.message);

    const messageToSave = {
      id: dataBase.message.length ? dataBase.message.length + 1 : 1,
      name: socket.handshake.auth.name,
      message: moderationResult.censoredText,
      imageUrl: "",
      isModerated: !moderationResult.isSafe,
    };

    dataBase.message.push(messageToSave);

    if (!moderationResult.isSafe) {
      socket.emit("moderation-warning", {
        messageId: messageToSave.id,
        original: data.message,
        imageUrl: "",
        warning: moderationResult.warning,
      });

      io.emit("public-moderation-warning", {
        messageId: messageToSave.id,
        userName: data.name,
        imageUrl: "",
        warning: moderationResult.warning,
      });
    }

    io.emit("history-message", dataBase.message);
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Set([socket.id]), creator: socket.id });
    } else {
      rooms.get(roomId).users.add(socket.id);
    }

    socket.to(roomId).emit("user-joined", socket.id);
    updateRoomUsers(roomId);
  });

  socket.on("call-user", (data) => {
    socket.to(data.target).emit("call-made", {
      offer: data.offer,
      caller: socket.id,
      room: data.roomId,
    });
  });

  socket.on("make-answer", (data) => {
    socket.to(data.target).emit("answer-made", {
      answer: data.answer,
      answerer: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    rooms.forEach((roomData, roomId) => {
      if (roomData.users.has(socket.id)) {
        roomData.users.delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);
        updateRoomUsers(roomId);

        if (roomData.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });

  function updateRoomUsers(roomId) {
    const roomUsers = Array.from(rooms.get(roomId)?.users || []);
    io.to(roomId).emit("room-users", roomUsers);
  }
});

module.exports = httpServer;

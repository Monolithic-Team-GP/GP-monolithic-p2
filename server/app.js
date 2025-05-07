require("dotenv").config();
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

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", // Updated model name
});
// Fungsi untuk memeriksa konten dengan Gemini AI
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
      // Coba parse respon secara langsung
      aiResponse = JSON.parse(response.text());
    } catch (parseError) {
      // Jika parsing gagal, ekstrak JSON dari respon
      const responseText = response.text();
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback jika tidak ada JSON valid
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

io.on("connection", (socket) => {
  socket.on("satu", (tes) => {
    // console.log("🚀 ~ socket.on ~ tes:", tes);
    socket.emit("rtrt", tes);
  });

  socket.on("message", async (data) => {
    // Moderate the message content
    const moderationResult = await moderateContent(data.message);

    // Create the message object with moderated content if needed
    const messageToSave = {
      id: dataBase.message.length ? dataBase.message.length + 1 : 1,
      name: data.name,
      message: moderationResult.censoredText, // Always use the censored version (will be unchanged if safe)
      isModerated: !moderationResult.isSafe,
    };

    // Save the message
    dataBase.message.push(messageToSave);

    // If content was inappropriate, notify the sender
    if (!moderationResult.isSafe) {
      // Send warning to the sender
      socket.emit("moderation-warning", {
        messageId: messageToSave.id,
        original: data.message,
        warning: moderationResult.warning,
      });

      // Also broadcast a public warning to all users
      io.emit("public-moderation-warning", {
        messageId: messageToSave.id,
        userName: data.name,
        warning: moderationResult.warning,
      });
    }

    // Broadcast updated message history to all clients
    io.emit("history-message", dataBase.message);
  });
});

httpServer.listen(PORT, () => {
  console.log("Server listening on PORT", PORT);
});

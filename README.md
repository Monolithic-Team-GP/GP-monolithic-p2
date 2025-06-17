# ThisCord

ThisCord is a modern group chat application platform that combines real-time chat, voice calls, image uploads, and AI moderation to keep conversations safe and comfortable. This project consists of two main parts: **client** (React frontend) and **server** (Node.js/Express + Socket.IO backend).

---

## Main Features

- **Global Chat**: Instant chat with all users online globally.
- **Voice Call**: Group voice calls using WebRTC for direct communication.
- **Image Upload**: Send and share images in group conversations.
- **AI Moderator**: Automatic AI-based moderation system (Google Gemini) to filter inappropriate words and provide warnings.
- **Moderation Notifications**: Visual warnings if chat rules are violated.
- **Message History**: Messages are stored as long as the server is running, so users can see chat history when rejoining.
- **Simple Login**: Login with just a username, no registration or password required.
- **Online User List**: Sidebar displays all currently online users.

---

## Project Structure

```
GP-monolithic-p2/
│
├── client/         # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── socket/
│   ├── public/
│   ├── index.html
│   └── ... (config & assets)
│
├── server/         # Node.js/Express + Socket.IO Backend
│   ├── app.js
│   ├── bin/www
│   ├── .env.example
│   └── ...
│
└── README.md
```

---

## How to Run the Project

### 1. Clone the Repository

```sh
git clone https://github.com/Monolithic-Team-GP/GP-monolithic-p2.git
cd GP-monolithic-p2
```

### 2. Setup Server (Backend)

1. Go to the `server` folder:
   ```sh
   cd server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your Gemini API key and Cloudinary configuration:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```
4. Run the server:
   ```sh
   node bin/www
   ```
   The server will run on port 3000 (or as set in the `PORT` variable).

### 3. Setup Client (Frontend)

1. Go to the `client` folder:
   ```sh
   cd ../client
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the React app:
   ```sh
   npm run dev
   ```
4. Open your browser and go to `http://localhost:5173` (or the port shown in the terminal).

---

## Technologies Used

- **Frontend**: React, Vite, TailwindCSS, SweetAlert2, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, Cloudinary, Google Generative AI (Gemini)
- **Real-Time Features**: Socket.IO (chat, online users, voice call)
- **AI Moderation**: Google Gemini API for detecting and censoring inappropriate words
- **Image Upload**: Cloudinary

---

## Usage Notes

- **Voice Call**: Uses WebRTC, make sure your browser supports microphone access.
- **AI Moderation**: Messages containing inappropriate words will be censored and users will receive a warning.
- **Data Storage**: Messages and online users are only stored while the server is running (in-memory, not a database).
- **Socket Configuration**: Make sure the Socket.IO server URL in the frontend ([`client/src/socket/socket.js`](client/src/socket/socket.js)) matches your backend address.

---

Enjoy using **ThisCord**!

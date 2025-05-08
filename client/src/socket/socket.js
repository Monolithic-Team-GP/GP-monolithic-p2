import { io } from "socket.io-client";

const socket = io(import.meta.env.PROD || "https://coba-gp.azriltdkso.fun");

export default socket;

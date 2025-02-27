
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "https://thesquare.onrender.com";

// Create the socket instance. We disable autoConnect so you can control when to connect.
export const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false,
});

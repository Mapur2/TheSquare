import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { socket } from "./socket";
import toast from "react-hot-toast";

// Use the same ACTIONS constants as in your other components
const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  ERROR: "error",
};

const GamePage = () => {
  const { roomId } = useParams();
  const { username } = useLocation().state || {};
  const navigate = useNavigate();
  const [assignedRole, setAssignedRole] = useState(null);

  useEffect(() => {
    if (!username || !roomId) {
      toast.error("Missing username or room ID!");
      return;
    }
    // Connect the socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit(ACTIONS.JOIN, { roomId, username });
    socket.on(ACTIONS.JOINED, (data) => {
      if (data.socketId === socket.id) {
        setAssignedRole(data.role);
        // Redirect based on the assigned role.
        if (data.role === "human") {
          navigate(`/game/human/${roomId}`, { state: { username } });
        } else if (data.role === "rook") {
          navigate(`/game/rook/${roomId}`, { state: { username } });
        } else if (data.role === "bishop") {
          navigate(`/game/bishop/${roomId}`, { state: { username } });
        }
      }
    });

    socket.on(ACTIONS.ERROR, (data) => {
      toast.error(data.message);
    });

    return () => {
      socket.off(ACTIONS.JOINED);
      socket.off(ACTIONS.ERROR);
      // Do NOT disconnect the socket here!
      // socket.disconnect();  <-- Remove or comment out this line.
    };
  }, [roomId, username, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Assigning your role... Please wait.</p>
    </div>
  );
};

export default GamePage;

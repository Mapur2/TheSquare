import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const id = uuid();
    setRoomId(id);
    toast.success("Room ID generated successfully!");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Both Room ID and Username are required!");
      return;
    }
    navigate(`/game/${roomId}`, {
      state: { username },
    });
    toast.success("Joined Room: " + roomId);
  };

  const handleInputEnter = (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  useEffect(() => {
    toast.success("Please read the rules first if you are new to the game.");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-xl relative">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Join a Game Room
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your role will be assigned automatically by the server.
          </p>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleInputEnter}
            placeholder="Enter Room ID"
            className="appearance-none rounded-md block w-full px-4 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={handleInputEnter}
            placeholder="Enter Username"
            className="appearance-none rounded-md block w-full px-4 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={joinRoom}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Join Room
        </button>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-gray-600 text-sm">
            Don&apos;t have a Room ID?{" "}
            <span
              onClick={generateRoomId}
              className="font-medium text-indigo-600 hover:underline cursor-pointer"
            >
              Create New Room
            </span>
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 hover:underline font-medium"
          >
            Rules
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Modal overlay */}
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setIsModalOpen(false)}
          ></div>
          {/* Modal content */}
          <div className="bg-white rounded-lg shadow-lg max-w-lg mx-auto z-10 p-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xl font-semibold">Game Rules</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                <li>Three roles: Human, Bishop, and Rook.</li>
                <li>The Human must reach the exit without being caught by Bishop.</li>
                <li>If the Human meets Bishop without a screwdriver, it’s game over.</li>
                <li>Rook can lock/unlock doors to help Bishop chase the Human.</li>
                <li>Collect keys and screwdrivers to interact with doors and disable robots.</li>
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;

import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Link } from "react-router-dom";
import bishopInterface from "../assets/bishopInterface.png"; // Replace with your actual image paths
import humanInterface from "../assets/humanInterface.png";
import rookInterface from "../assets/rookInterface.png";
import searchResultImg from "../assets/searchResults.png";
import mapScreenshot from "../assets/mapScreenshot.png";
import autoSenseImg from "../assets/autoSense.png";

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
          
        <h1 className="text-5xl font-bold text-purple-400 mb-2">TheSquare</h1>
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
          <a href="/rules" target="_blank"
            className="text-indigo-600 hover:underline font-medium"
          >
            Rules
          </a>
        </div>
      </div>
    </div>

  );
}

export const HowToPlay = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex flex-col items-center p-6">
      {/* Heading */}
      <header className="mb-8">
        <h1 className="text-5xl font-bold text-purple-400 mb-2">TheSquare</h1> <span>
        Developed by <a href="https://mapur2.github.io/new_portfolio/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Rupam</a></span>
        <p className="text-xl text-gray-300 text-center max-w-2xl">
          Welcome to TheSquare! A strategic, turn-based multiplayer game where each player assumes a unique role. Outsmart your opponents by planning your moves, managing doors, and using your special abilities.
        </p>
      </header>

      {/* Game Interfaces */}
      <section className="w-full max-w-5xl mb-8">
        <h2 className="text-3xl font-bold mb-4 text-center">Game Interfaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <img src={humanInterface} alt="Human Interface" className="w-full h-auto rounded" />
            <p className="mt-2">Human Interface</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <img src={rookInterface} alt="Rook Interface" className="w-full h-auto rounded" />
            <p className="mt-2">Rook Interface</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <img src={bishopInterface} alt="Bishop Interface" className="w-full h-auto rounded" />
            <p className="mt-2">Bishop Interface</p>
          </div>
        </div>
      </section>

      {/* Game Features */}
      <section className="w-full max-w-5xl mb-8">
        <h2 className="text-3xl font-bold mb-4 text-center">Game Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <img src={searchResultImg} alt="Search Result" className="w-full h-auto rounded" />
            <p className="mt-2">Search Result</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <img src={mapScreenshot} alt="Map" className="w-full h-auto rounded" />
            <p className="mt-2">Map</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <img src={autoSenseImg} alt="Auto Sense" className="w-full h-auto rounded" />
            <p className="mt-2">Auto Sense</p>
          </div>
        </div>
      </section>

      {/* Game Rules */}
      <section className="w-full max-w-5xl mb-8 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-center">Game Rules</h2>
        <ul className="list-disc list-inside text-lg text-gray-300 space-y-2">
          <li><strong>Start & Exit:</strong> Begin at the starting cell (Room (1,1)) and reach the exit (Room (5,5)).</li>
          <li><strong>Roles:</strong> Human, Rook, and Bishop are manually controlled. Each role has unique abilities.</li>
          <li><strong>Encountering Bishop:</strong> If the Human meets Bishop without a screwdriver, it’s game over.</li>
          <li><strong>Rook's Role:</strong> Rook can lock/unlock doors to help Bishop catch the Human.</li>
          <li><strong>Items:</strong> Collect keys and screwdrivers to interact with doors and disable robots.</li>
          <li><strong>Turn Order:</strong> The game is turn-based: Human → Rook → Bishop.</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-400 text-xl">
        Developed by <a href="https://mapur2.github.io/new_portfolio/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Rupam</a>
      </footer>
    </div>
  );
};


export default Home;

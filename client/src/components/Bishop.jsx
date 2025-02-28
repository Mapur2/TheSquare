import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { socket } from "./socket.js";
import toast from "react-hot-toast";
import ACTIONS from "./Actions";
import rook from "../assets/bishop.jpeg";

const RookGamePage = () => {
  const { roomId } = useParams();
  const { username } = useLocation().state || {};
  const navigate = useNavigate(); // Add useNavigate for navigation

  const [gameState, setGameState] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [playerRole, setPlayerRole] = useState("bishop");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [autoSenseData, setAutoSenseData] = useState(null);
  const [currentRoom, setCurrentRoom] = useState({ x: 0, y: 0 });
  const [turn, setTurn] = useState(null);
  const [showAutoSenseModal, setShowAutoSenseModal] = useState(false);
  const [gameOverData, setGameOverData] = useState(null); // New state for game over

  // Socket connection and event handling
  useEffect(() => {
    if (!username || !roomId) {
      toast.error("Missing roomId or username!");
      return;
    }
    socket.connect();
    socket.emit(ACTIONS.JOIN, { roomId, username });

    socket.on(ACTIONS.JOINED, (data) => {
      toast.success(`${data.username} joined as ${data.role}`);
      if (data.socketId === socket.id) {
        setPlayerRole(data.role);
      }
    });

    socket.on(ACTIONS.GAME_START, (state) => {
      setGameState(state);
      console.log("game started")
      setTurn(state.currentTurn);
      setCurrentRoom(state.players.bishop.position || { x: 0, y: 0 });
      toast.success("Game has started!");
    });
    socket.on("bishopUpdate", (state) => {
      setGameState(state);
      console.log("game started")
      setTurn(state.currentTurn);
      setCurrentRoom(state.players.bishop.position || { x: 0, y: 0 });
      toast.success("Game has started!");
    });

    socket.on(ACTIONS.GAME_UPDATE, (state) => {
      setGameState(state);
      setTurn(state.currentTurn);
      setCurrentRoom(state.players.bishop.position || { x: 0, y: 0 });
      if (gameState.players.bishop.disabled)
        toast.error("Bishop is now disabled")
      if (gameState.players.rook.disabled)
        toast.error("Rook is now disabled")
    });

    socket.on(ACTIONS.GAME_OVER, (data) => {
      setGameState(data.gameState);
      setGameOverData(data); // Store game over info
      toast.error(data.message); // Show game over message
    });

    socket.on(ACTIONS.AUTO_SENSE_RESULT, (data) => {
      setAutoSenseData(data);
      setShowAutoSenseModal(true);
    });
    socket.on(ACTIONS.ERROR, (data) => {
      toast.error(data.message);
    });

    return () => {
      socket.off(ACTIONS.JOINED);
      socket.off(ACTIONS.GAME_START);
      socket.off(ACTIONS.GAME_UPDATE);
      socket.off(ACTIONS.GAME_OVER);
      socket.off(ACTIONS.AUTO_SENSE_RESULT);
      socket.off(ACTIONS.ERROR)
      socket.off("bishopUpdate")
    };
  }, [roomId, username]);

  const sendAction = (action, direction = null) => {
    if (!socket || !gameState || actionInProgress) return;
    setActionInProgress(true);
    socket.emit("playerAction", { playerType: playerRole, action, direction });
    setTimeout(() => setActionInProgress(false), 300);
  };

  // Render the main UI with Rook avatar and movement buttons
  const renderMainUI = () => {
    if (!gameState) return <div className="text-center">Waiting for game to start...</div>;
    return (
      <div className="relative flex flex-col items-center my-6">
        <h3 className="text-lg font-bold mb-2">Current Room: ({currentRoom.y}, {currentRoom.x})</h3>
        <h4 className="text-sm font-bold mb-4">Disabled: {`${gameState?.players?.bishop?.disabled}`}</h4>
        <h3 className="text-lg font-bold mb-4">
          Turn :{gameState?.turnOrder[gameState.currentTurn] && (gameState?.turnOrder[gameState.currentTurn] === playerRole ? "🎮 Your Turn" : `⏳ ${gameState?.turnOrder[gameState.currentTurn]}'s Turn`)}
        </h3>
        <div className="w-40 h-40 rounded-full border-4 border-indigo-500 shadow-xl flex items-center justify-center bg-white">
          <img src={rook} alt="Rook Avatar" className="w-36 h-36 rounded-full" />
        </div>
        <button
          onClick={() => sendAction("pass")}
          className="col-span-3 bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition"
        >
          Pass My Turn
        </button>
        <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-xs">
          <button
            onClick={() => sendAction("move", "north")}
            className="col-span-3 bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition"
          >
            ↑ North
          </button>
          <button
            onClick={() => sendAction("move", "west")}
            className="bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition"
          >
            ← West
          </button>
          <button
            onClick={() => sendAction("move", "east")}
            className="bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition"
          >
            → East
          </button>
          <button
            onClick={() => sendAction("move", "south")}
            className="col-span-3 bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition"
          >
            ↓ South
          </button>
        </div>
      </div>
    );
  };

  // Render the action panel with lock/unlock and auto-sense buttons
  const renderActionPanel = () => (
    <div className="mt-4 flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold">Door Controls</h3>

      <button
        onClick={() => setShowMapModal(true)}
        className="px-6 py-3 bg-gray-500 text-white rounded-xl shadow hover:bg-gray-600 transition"
      >
        Open Map
      </button>
      <button
        onClick={() => sendAction("autoSense")}
        className="w-full max-w-md px-6 py-3 bg-purple-500 text-white rounded-xl shadow hover:bg-purple-600 transition"
      >
        Auto Sense
      </button>
    </div>
  );
  const renderMap = () => {
    if (!gameState?.grid) return null;

    return (
      <div className="grid grid-cols-5 gap-px bg-gray-200">
        {[...gameState.grid].reverse().map((row, reversedY) => {
          const actualY = gameState.grid.length - 1 - reversedY;

          return row.map((cell, x) => {
            const isCurrentCell =
              gameState.players.bishop.position.x === x &&
              gameState.players.bishop.position.y === actualY;

            return (
              <div
                key={`${x}-${actualY}`}
                className={`relative bg-white aspect-square`}
              >
                {/* Doors */}
                <div className="absolute inset-0 flex justify-between">
                  <div className={`w-1/5 h-full ${cell.doors.west.locked ? "bg-red-500" : "bg-green-500"}`} />
                  <div className={`w-1/5 h-full ${cell.doors.east.locked ? "bg-red-500" : "bg-green-500"}`} />
                </div>
                <div className="absolute inset-0 flex flex-col justify-between">
                  <div className={`h-1/5 w-full ${cell.doors.north.locked ? "bg-red-500" : "bg-green-500"}`} />
                  <div className={`h-1/5 w-full ${cell.doors.south.locked ? "bg-red-500" : "bg-green-500"}`} />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-1 flex flex-col items-center justify-center">
                  <div className="text-xs text-gray-500">
                    ({actualY}, {x})
                  </div>
                  {/* <div className="flex gap-1 mt-1">
                    {cell.items?.map((item) => (
                      <span key={item} className="text-xs bg-purple-100 px-1 rounded">
                        {item}
                      </span>
                    ))}
                  </div> */}
                  <div className="flex gap-1">
                    {gameState.players.bishop.position.x === x &&
                      gameState.players.bishop.position.y === actualY && (
                        <span className="text-blue-500 text-lg font-bold">You</span>
                      )}
                    {/*  {gameState.players.rook.position.x === x &&
                      gameState.players.rook.position.y === actualY && (
                        <span className="text-yellow-500">⚔️</span>
                      )}
                    {gameState.players.bishop.position.x === x &&
                      gameState.players.bishop.position.y === actualY && (
                        <span className="text-red-500">☠️</span>
                      )} */}
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>
    );
  };
  // Render the auto-sense modal with adjacent room data
  const renderAutoSenseModal = () => {
    if (!autoSenseData || !showAutoSenseModal) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Modal overlay */}
        <div
          className="absolute inset-0 bg-black opacity-50"
          onClick={() => setShowAutoSenseModal(false)}
        ></div>
        {/* Modal content */}
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full z-10">
          <h2 className="text-2xl font-bold text-center mb-4">Auto-Sense Results</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(autoSenseData).map(([dir, data]) => {
              if (!data) {
                return (
                  <div key={dir} className="border p-4 rounded-lg">
                    <h3 className="text-xl font-semibold capitalize">{dir}</h3>
                    <p className="font-medium text-gray-500">No room in this direction.</p>
                  </div>
                );
              }

              return (
                <div key={dir} className="border p-4 rounded-lg">
                  <h3 className="text-xl font-semibold capitalize">{dir}</h3>
                  {/* Door Status */}
                  {data.doorStatus && (<p className="font-medium">
                    Door:{" "}
                    <span
                      className={`font-bold ${data.doorStatus === "Locked" ? "text-red-500" : "text-green-500"
                        }`}
                    >
                      {data.doorStatus}
                    </span>
                  </p>)}
                  {/* Items */}
                  <p className="font-medium">
                    Items:{" "}
                    {data.items && data.items.length > 0 ? (
                      <span className="text-blue-500">{data.items.join(", ")}</span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </p>
                  {/* Players */}
                  <p className="font-medium">
                    Players:{" "}
                    {data.players && data.players.length > 0 ? (
                      <span className="text-purple-500">
                        {data.players.map((p) => p.role).join(", ")}
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </p>
                  {data.humanItems?.length>0 && (<p className="font-medium">
                    Item with human:{" "}
                    {data?.humanItems?.length > 0 ? (
                      <span className="text-purple-500">
                        {data.humanItems[0]}
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </p>)}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAutoSenseModal(false)}
            className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // Render the game over modal
  const renderGameOverModal = () => {
    if (!gameOverData) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Modal overlay */}
        <div
          className="absolute inset-0 bg-black opacity-50"
          onClick={() => { }}
        ></div>
        {/* Modal content */}
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Game Over</h2>
          <p className="mb-6">{gameOverData.message}</p>
          <button
            onClick={() => navigate("/")} // Navigate to home page
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        {/* Header with room ID */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <h1 className="text-4xl font-extrabold text-center">Game Room: {roomId}</h1>
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              toast.success("Room ID copied to clipboard!");
            }}
            className="text-sm text-indigo-600 hover:underline"
          >
            Copy
          </button>
        </div>
        <p className="text-center text-xl mb-6">
          You are playing as:{" "}
          <span className="font-bold uppercase text-indigo-600">{playerRole}</span>
        </p>
        {/* Main UI */}
        {renderMainUI()}
        {/* Action Panel */}
        {renderActionPanel()}
      </div>
      {showMapModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowMapModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full z-10 overflow-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-center mb-4">Game Map</h2>
            {renderMap()}
            <button
              onClick={() => setShowMapModal(false)}
              className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition"
            >
              Close Map
            </button>
          </div>
        </div>
      )}
      {/* Auto-Sense Modal */}
      {renderAutoSenseModal()}
      {/* Game Over Modal */}
      {renderGameOverModal()}
    </div>
  );
};

export default RookGamePage;
import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { socket } from "./socket.js"; // Adjust path as needed
import toast from "react-hot-toast";
import ACTIONS from "./Actions";
import human from "../assets/human.webp";

const HumanGamePage = () => {
  const { roomId } = useParams();
  const { username } = useLocation().state || {};
  const navigate = useNavigate();

  const [gameState, setGameState] = useState(null);
  const [playerRole, setPlayerRole] = useState("human"); // Assigned by server
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false); // New state for search modal
  const [searchResult, setSearchResult] = useState(null);
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
      toast.success("Game has started!");
    });

    socket.on(ACTIONS.GAME_UPDATE, (state) => {
      setGameState(state);
      if(state.currentTurn==0  )
        toast.success("Your Turn")
      if(state.players.bishop.disabled)
        toast.success("Bishop is now disabled")
      if(state.players.rook.disabled)
        toast.success("Rook is now disabled")
    });

    socket.on(ACTIONS.SEARCH_RESULT, (result) => {
      setSearchResult(result);
      setShowSearchModal(true); // Show search modal when search results are received
      toast.info("Search complete. Check available items and players below.");
    });

    socket.on(ACTIONS.GAME_OVER, (data) => {
      setGameState(data.gameState);
      setGameOverData(data); // Store game over info
      // Close any open modals
      setShowMapModal(false);
      setShowSearchModal(false);
      toast.error(data.message);
    });

    socket.on(ACTIONS.ERROR, (data) => {
      toast.error(data.message);
    });

    return () => {
      socket.off(ACTIONS.JOINED);
      socket.off(ACTIONS.GAME_START);
      socket.off(ACTIONS.GAME_UPDATE);
      socket.off(ACTIONS.SEARCH_RESULT);
      socket.off(ACTIONS.GAME_OVER);
      socket.off(ACTIONS.ERROR);
      // Do not disconnect for persistent connection
    };
  }, [roomId, username]);

  const sendAction = (action, direction = null, extraPayload = {}) => {
    if (!socket || !gameState) return;
    if (actionInProgress) return;

    // Handle item-specific actions
    if (action === "pickup" || action === "drop") {
      if (!extraPayload.itemType) {
        toast.error("Please select an item type!");
        return;
      }
    }

    setActionInProgress(true);
    const payload = { playerType: playerRole, action, direction, ...extraPayload };
    socket.emit("playerAction", payload);
    setTimeout(() => setActionInProgress(false), 300);
  };

  // Render the central avatar with arrow move buttons around it.
  const renderMainUI = () => {
    if (!gameState) return <div className="text-center">Waiting for game to start...</div>;
    return (
      <div className="relative flex items-center justify-center my-6">
        {/* Central Avatar */}
        <div className="w-40 h-40 rounded-full border-4 border-indigo-500 shadow-2xl flex items-center justify-center bg-white">
          <img src={human} alt="Human Avatar" className="w-36 h-36 rounded-full" />
        </div>
        {/* Arrow Buttons */}
        <button
          onClick={() => sendAction("move", "north")}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
        >
          ↑
        </button>
        <button
          onClick={() => sendAction("move", "south")}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
        >
          ↓
        </button>
        <button
          onClick={() => sendAction("move", "east")}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
        >
          →
        </button>
        <button
          onClick={() => sendAction("move", "west")}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
        >
          ←
        </button>
      </div>
    );
  };

  // Render turn indicator and current position
  const renderTurnAndPosition = () => {
    if (!gameState) return null;

    const currentTurn = gameState.turnOrder[gameState.currentTurn];
    const humanPosition = gameState.players.human.position;

    return (
      <div className="text-center mb-6">
        <div className="bg-indigo-100 p-4 rounded-xl inline-block">
          <p className="text-xl font-bold mb-2">
            {currentTurn === "human" ? "🎮 Your Turn" : `⏳ ${currentTurn}'s Turn`}
          </p>
          <p className="text-lg">
            Your Position: ({humanPosition.y}, {humanPosition.x})
          </p>
        </div>
      </div>
    );
  };

  // Render action panel with buttons for Pickup, Drop, Search, and Map.
  const renderActionPanel = () => {
    const currentInventory = gameState?.players?.human?.inventory || [];

    return (
      <div className="mt-4 flex flex-col items-center space-y-4">
        {renderTurnAndPosition()}

        {/* Enhanced Pickup/Drop with item selection */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          <div className="bg-gray-100 p-4 rounded-xl">
            <h3 className="font-bold mb-2">Item Actions</h3>
            <div className="flex gap-4 justify-center">
              {/* Pickup */}
              <div className="flex flex-col items-center">
                <p className="mb-2 text-sm">Pickup:</p>
                <div className="flex gap-2">
                  {searchResult?.items?.map((item) => (
                    <button
                      key={item}
                      onClick={() => sendAction("pickup", null, { itemType: item.toLowerCase() })}
                      className="px-4 py-2 bg-green-500 text-white rounded-full shadow"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop */}
              <div className="flex flex-col items-center">
                <p className="mb-2 text-sm">Drop:</p>
                <div className="flex gap-2">
                  {currentInventory.map((item) => (
                    <button
                      key={item}
                      onClick={() => sendAction("drop", null, { itemType: item })}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-full shadow"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Door Controls */}
          <div className="bg-gray-100 p-4 rounded-xl w-full">
            <h3 className="font-bold mb-4 text-center">Door Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              {["north", "east", "south", "west"].map((direction) => (
                <div key={direction} className="flex items-center gap-2">
                  <span className="w-20 font-semibold capitalize">{direction}:</span>
                  <button
                    onClick={() => sendAction("lockDoor", direction)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded shadow"
                  >
                    🔒 Lock
                  </button>
                  <button
                    onClick={() => sendAction("unlockDoor", direction)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded shadow"
                  >
                    🔓 Unlock
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={() => sendAction("search")}
          className="px-6 py-3 bg-purple-500 text-white rounded-xl shadow hover:bg-purple-600 transition"
        >
          Search Room
        </button>

        {/* Map Button */}
        <button
          onClick={() => setShowMapModal(true)}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl shadow hover:bg-gray-600 transition"
        >
          Open Map
        </button>
      </div>
    );
  };

  // Render Search Modal
  const renderSearchModal = () => {
    if (!searchResult || !showSearchModal) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Modal overlay */}
        <div
          className="absolute inset-0 bg-black opacity-50"
          onClick={() => setShowSearchModal(false)}
        ></div>
        {/* Modal content */}
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full z-10">
          <h2 className="text-2xl font-bold text-center mb-4">Search Results</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Items in Room:</h3>
              {searchResult.items && searchResult.items.length > 0 ? (
                <ul className="list-disc list-inside">
                  {searchResult.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No items found.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold">Players in Room:</h3>
              {searchResult.players && searchResult.players.length > 0 ? (
                <ul className="list-disc list-inside">
                  {searchResult.players.map((player, index) => (
                    <li key={index}>{player.role}</li>
                  ))}
                </ul>
              ) : (
                <p>No other players found.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold">Door Status:</h3>
              <ul className="list-disc list-inside">
                {Object.entries(searchResult.doors || {}).map(([dir, status]) => (
                  <li key={dir}>
                    {dir}: {status.locked ? "🔒 Locked" : "🔓 Unlocked"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => setShowSearchModal(false)}
            className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  };
  const renderMap = () => {
    if (!gameState?.grid) return null;

    return (
      <div className="grid grid-cols-5 gap-px bg-gray-200">
        {[...gameState.grid].reverse().map((row, reversedY) => {
          const actualY = gameState.grid.length - 1 - reversedY;

          return row.map((cell, x) => {
            const isCurrentCell =
              gameState.players.human.position.x === x &&
              gameState.players.human.position.y === actualY;

            return (
              <div
                key={`${x}-${actualY}`}
                className={`relative bg-white aspect-square ${isCurrentCell ? "ring-4 ring-blue-500" : ""}`}
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
                    {gameState.players.human.position.x === x &&
                      gameState.players.human.position.y === actualY && (
                        <span className="text-blue-500 text-lg font-bold">You</span>
                      )}
                    {gameState.players.rook.position.x === x &&
                      gameState.players.rook.position.y === actualY && (
                        <span className="text-yellow-500 text-lg fond-bold">Rook</span>
                      )}
                    {gameState.players.bishop.position.x === x &&
                      gameState.players.bishop.position.y === actualY && (
                        <span className="text-red-500 text-lg fond-bold">Bishop</span>
                      )}
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>
    );
  };
  // Render Game Over Modal
  const renderGameOverModal = () => {
    if (!gameOverData) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Modal overlay */}
        <div className="absolute inset-0 bg-black opacity-50" onClick={() => { }}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Game Over</h2>
          <p className="mb-6">{gameOverData.message}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-300 to-red-300 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        {/* Header with copyable Room ID */}
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
        {/* Central Game Area */}
        {renderMainUI()}
        {/* Action Panel */}
        {renderActionPanel()}
      </div>
      {/* Search Modal */}
      {renderSearchModal()}
      {/* Map Modal */}
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
      {/* Game Over Modal */}
      {gameOverData && renderGameOverModal()}
    </div>
  );
};

export default HumanGamePage;
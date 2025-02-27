import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import createGameState from './game.js'; // your game factory function

const app = express();
app.use(cors({
    origin: "https://the-square-omega.vercel.app",
    methods: ["*"],
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://the-square-omega.vercel.app",
        methods: ["*"],
    },
});

const PORT = 4000;

// In-memory storage for rooms and user mapping.
// Each room: { players: [ { socketId, username, role } ], availableRoles: [...], gameState }
const rooms = {};
const userSocketMap = {};

// Action constants – adjust these as needed.
const ACTIONS = {
    JOIN: "join",
    JOINED: "joined",
    GAME_START: "gameStart",
    GAME_UPDATE: "gameUpdate",
    ERROR: "error",
    SEARCH_RESULT: "searchResult",
    GAME_OVER: "gameOver",
    AUTO_SENSE_RESULT: "autoSense"
};

// Helper: Get all connected clients for a given room.
function getAllConnectedClients(roomId) {
    const clients = [];
    const s = io.sockets.adapter.rooms.get(roomId);
    if (s) {
        for (const socketId of s) {
            clients.push({ socketId, username: userSocketMap[socketId] });
        }
    }
    return clients;
}

// --- SENSING HELPERS ---
// Returns a direction ("north", "south", etc.) if the human is in an adjacent room relative to player.
function findHumanAdjacent(playerType, gameState) {
    const playerPos = gameState.players[playerType].position;
    const humanPos = gameState.players.human.position;
    if (humanPos.x === playerPos.x && humanPos.y === playerPos.y + 1) return 'north';
    if (humanPos.x === playerPos.x && humanPos.y === playerPos.y - 1) return 'south';
    if (humanPos.y === playerPos.y && humanPos.x === playerPos.x + 1) return 'east';
    if (humanPos.y === playerPos.y && humanPos.x === playerPos.x - 1) return 'west';
    return null;
}

// --- COLLISION / DISABLE CHECK ---
// If human and bishop share a room:
//   - If human has a screwdriver, disable bishop.
//   - Otherwise, game over.
// Also, if human and rook share a room and human has a screwdriver, disable rook.
function checkCollisions(gameState) {
    const humanInv = gameState.players.human.inventory;
    const humanPos = gameState.players.human.position;
    const bishopPos = gameState.players.bishop.position;
    const rookPos = gameState.players.rook.position;
    let gameOver = false;
    let message = '';

    // Check bishop collision.
    if (humanPos.x === bishopPos.x && humanPos.y === bishopPos.y) {
        if (humanInv.includes('screwdriver')) {
            gameState.players.bishop.disabled = true;
        } else {
            gameOver = true;
            message = 'Bishop has caught the human and human has no screwdriver!';
        }
    }
    // Check rook collision.
    if (humanPos.x === rookPos.x && humanPos.y === rookPos.y) {
        if (humanInv.includes('screwdriver')) {
            gameState.players.rook.disabled = true;
            message="Human has screwdriver and disabled rook"
        }
        // Note: Rook collision does not cause game over.
    }
    return { gameOver, message };
}

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);


    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        // Save the username for this socket.
        userSocketMap[socket.id] = username;

        // If the room doesn't exist, create it.
        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [], // Array of { socketId, username, role }
                availableRoles: ['human', 'rook', 'bishop'],
                gameState: createGameState(), // New game state for this room.
            };
        }

        const room = rooms[roomId];

        // Check if the same username is already in the room.
        const existingPlayer = room.players.find((p) => p.username === username);
        if (existingPlayer) {
            // The user is rejoining.
            console.log(`User ${username} rejoined room ${roomId}`);
            // Update the socketId for this player.
            existingPlayer.socketId = socket.id;
            // Update the userSocketMap accordingly.
            userSocketMap[socket.id] = username;
            socket.join(roomId);
            // Send the JOINED event only to this reconnected socket.
            io.to(socket.id).emit(ACTIONS.JOINED, {
                clients: getAllConnectedClients(roomId),
                username,
                socketId: socket.id,
                role: existingPlayer.role,
            });
            return; // Do not assign a new role.
        }

        // Check if the room is full (3 players maximum).
        if (room.players.length >= 3) {
            socket.emit(ACTIONS.ERROR, { message: 'Room is full.' });
            return;
        }

        // Assign a unique role from availableRoles.
        const assignedRole = room.availableRoles.shift();

        // Join the room.
        socket.join(roomId);
        room.players.push({ socketId: socket.id, username, role: assignedRole });

        // Get the list of connected clients in the room.
        const clients = getAllConnectedClients(roomId);

        // Broadcast a JOINED event to all clients in the room.
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,         // Username of the client that just joined.
                socketId: socket.id,
                role: assignedRole
            });
        });

        if (room.players.length ===3) {
            io.to(roomId).emit(ACTIONS.GAME_START, room.gameState);
            setTimeout(()=>{
                socket.emit("bishopUpdate",room.gameState)
            },1500)
        }
    });
    // --- PLAYER ACTIONS HANDLER ---
    socket.on('playerAction', (data) => {
        // Example data: { playerType, action, direction? }
        // Determine the roomId from the rooms this socket is in.
        const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
        if (!roomId) return;
        processPlayerAction(data, socket, roomId);
    });

    socket.on('disconnect', () => {
        delete userSocketMap[socket.id]; // Assuming you're tracking users in an object
    });
});

// --- PROCESSING PLAYER ACTIONS ---

function processPlayerAction(data, socket, roomId) {
    const room = rooms[roomId];
    const gameState = room.gameState;

    // Prevent actions if bishop or rook are disabled.
    if ((data.playerType === 'bishop' || data.playerType === 'rook') &&
        gameState.players[data.playerType].disabled) {
        socket.emit(ACTIONS.ERROR, { message: `${data.playerType} is disabled and cannot act.` });
        return;
    }

    // Auto-sense behavior for bishop and rook.
    // Instead of moving, gather adjacent details and send them only to the requesting client.
    if ((data.playerType === 'bishop' || data.playerType === 'rook') && data.action === 'autoSense') {
        const adjacentDetails = getAdjacentRoomDetails(data.playerType, gameState);
        socket.emit(ACTIONS.AUTO_SENSE_RESULT, adjacentDetails);
        return;
    }

    // Enforce turn order.
    const currentPlayer = gameState.turnOrder[gameState.currentTurn];
    if (data.playerType !== currentPlayer) {
        socket.emit(ACTIONS.ERROR, { message: 'It is not your turn.' });
        return;
    }

    let result; // For pickup/drop/search responses.

    switch (data.action) {
        case 'move':
            // For human and bishop, check door state before moving.
            if ((data.playerType === 'human' || data.playerType === 'bishop') &&
                !isDoorUnlocked(gameState, data.playerType, data.direction)) {
                socket.emit(ACTIONS.ERROR, { message: 'The door is locked.' });
            } else {
                updatePlayerPosition(data.playerType, data.direction, gameState);
            }
            break;

        case 'lockDoor':
            if (gameState.players[data.playerType] == "human" && !gameState.players[data.playerType].inventory.includes('key')) {
                socket.emit(ACTIONS.ERROR, { message: 'You do not have a key to lock the door.' });
            } else {
                updateDoorState(data.playerType, data.direction, true, gameState);
            }
            break;

        case 'unlockDoor':
            if (!gameState.players[data.playerType].inventory.includes('key')) {
                socket.emit(ACTIONS.ERROR, { message: 'You do not have a key to unlock the door.' });
            } else {
                updateDoorState(data.playerType, data.direction, false, gameState);
            }
            break;

        case 'pickup':
            result = pickupItem(data.playerType, gameState);
            if (result.error) {
                socket.emit(ACTIONS.ERROR, { message: result.error });
            }
            break;

        case 'drop':
            result = dropItem(data.playerType, gameState);
            if (result.error) {
                socket.emit(ACTIONS.ERROR, { message: result.error });
            }
            break;

        case 'search':
            result = searchRoom(data.playerType, gameState);
            // Send search results only to the requesting client.
            socket.emit(ACTIONS.SEARCH_RESULT, result);
            break;
        case 'map':
            socket.emit(ACTIONS.GAME_UPDATE, gameState);
            // Do not advance turn on map.
            return;
        case 'pass':
            break;
        default:
            socket.emit(ACTIONS.ERROR, { message: 'Unknown action.' });
            return;
    }

    const collision = checkCollisions(gameState);
    if (collision.gameOver) {
        delete rooms[roomId]
        io.to(roomId).emit(ACTIONS.GAME_OVER, {
            message: collision.message,
            gameState,
        });
        return;
    }
    const human=gameState.players.human.position
    if(human.x==4 && human.y==4){
        delete rooms[roomId]
        io.to(roomId).emit(ACTIONS.GAME_OVER,{
            message:"Human has won as he reached the 4,4 corner.",
            gameState
        })
        return;
    }

    advanceTurn(gameState);
    if(gameState.currentTurn=="rook" && gameState.players.rook.disabled)
        advanceTurn(gameState);
    if(gameState.players.bishop.disabled)
    {
        advanceTurn(gameState);
    }
    if(gameState.currentTurn=="bishop" && gameState.players.bishop.disabled && gameState.players.bishop.disabled){
        delete rooms[roomId]
        io.to(roomId).emit(ACTIONS.GAME_OVER,{
            message:"Both rook and bishop is disabled. Human has won the game!",
            gameState
        })
        return;
    }

    // Broadcast updated game state to all clients in the room.
    io.to(roomId).emit(ACTIONS.GAME_UPDATE, gameState);
}
// --- HELPER FUNCTIONS ---
function getAdjacentRoomDetails(playerType, gameState) {
    const pos = gameState.players[playerType].position;
    const grid = gameState.grid;
    const gridSize = grid.length;
    const details = {};

    const directions = {
        north: { dx: 0, dy: 1, opposite: 'south' },
        south: { dx: 0, dy: -1, opposite: 'north' },
        east: { dx: 1, dy: 0, opposite: 'west' },
        west: { dx: -1, dy: 0, opposite: 'east' }
    };

    for (const dir in directions) {
        const { dx, dy, opposite } = directions[dir];
        const newX = pos.x + dx;
        const newY = pos.y + dy;
        if ((newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) && grid[newY][newX]) {
            const adjacentRoom = grid[newY][newX];
            details[dir] = {
                doorStatus: adjacentRoom.doors[opposite]?.locked ? "Locked" : "Unlocked",
                items: adjacentRoom.items,
                // Collect players in the adjacent room.
                players: Object.entries(gameState.players)
                    .filter(([role, player]) => player.position.x === newX && player.position.y === newY)
                    .map(([role]) => ({ role }))
            };
        } else {
            details[dir] = null;
        }
    }
    const adjacentRoom = grid[pos.y][pos.x];
    details["current"] = {
        items: adjacentRoom.items,
        // Collect players in the adjacent room.
        players: Object.entries(gameState.players)
            .filter(([role, player]) => player.position.x === pos.x && player.position.y === pos.y)
            .map(([role]) => ({ role })),
        humanItems:gameState.players.human.inventory
    };
    return details;
}
// Check if the door in the given direction (from the player's room) is unlocked.
function isDoorUnlocked(gameState, playerType, direction) {
    const pos = gameState.players[playerType].position;
    const door = gameState.grid[pos.y][pos.x].doors[direction];
    return door && !door.locked;
}

// Moves a player in the specified direction.
function updatePlayerPosition(playerType, direction, gameState) {
    const pos = gameState.players[playerType].position;
    let newX = pos.x;
    let newY = pos.y;
    if (direction === 'north' && pos.y < 4) newY = pos.y + 1;
    else if (direction === 'south' && pos.y > 0) newY = pos.y - 1;
    else if (direction === 'east' && pos.x < 4) newX = pos.x + 1;
    else if (direction === 'west' && pos.x > 0) newX = pos.x - 1;
    pos.x = newX;
    pos.y = newY;
}

// Updates the door state (lock/unlock) for the player's current room.
// Only non-permanent doors can be changed.
function updateDoorState(playerType, direction, lock, gameState) {
    const pos = gameState.players[playerType].position;
    // Update door in the current room.
    const currentDoor = gameState.grid[pos.y][pos.x].doors[direction];
    if (currentDoor && !currentDoor.permanent) {
        currentDoor.locked = lock;
    }

    // Determine adjacent room and corresponding opposite door.
    let adjacentX = pos.x, adjacentY = pos.y, oppositeDoor = "";
    if (direction === "north") {
        adjacentY = pos.y + 1;
        oppositeDoor = "south";
    } else if (direction === "south") {
        adjacentY = pos.y - 1;
        oppositeDoor = "north";
    } else if (direction === "east") {
        adjacentX = pos.x + 1;
        oppositeDoor = "west";
    } else if (direction === "west") {
        adjacentX = pos.x - 1;
        oppositeDoor = "east";
    }

    const gridSize = gameState.grid.length;
    if (adjacentX >= 0 && adjacentX < gridSize && adjacentY >= 0 && adjacentY < gridSize) {
        const adjacentRoom = gameState.grid[adjacentY][adjacentX];
        const doorInAdjacent = adjacentRoom.doors[oppositeDoor];
        if (doorInAdjacent && !doorInAdjacent.permanent) {
            doorInAdjacent.locked = lock;
        }
    }
}


// Allows a player to pick up an item in the current room.
function pickupItem(playerType, gameState) {
    const pos = gameState.players[playerType].position;
    const room = gameState.grid[pos.y][pos.x];
    if (gameState.players[playerType].inventory.length > 0) {
        return { error: 'You are already carrying an item.' };
    }
    if (room.items.length > 0) {
        const item = room.items.shift();
        gameState.players[playerType].inventory.push(item);
        return { message: `Picked up ${item}.` };
    } else {
        return { error: 'There are no items to pick up in this room.' };
    }
}

// Allows a player to drop an item in the current room.
function dropItem(playerType, gameState) {
    const pos = gameState.players[playerType].position;
    const room = gameState.grid[pos.y][pos.x];
    if (gameState.players[playerType].inventory.length === 0) {
        return { error: 'You have no item to drop.' };
    }
    const item = gameState.players[playerType].inventory.pop();
    room.items.push(item);
    return { message: `Dropped ${item}.` };
}

// Returns the items and door statuses in the current room.
function searchRoom(playerType, gameState) {
    const pos = gameState.players[playerType].position;
    const room = gameState.grid[pos.y][pos.x];

    // Find all players in the same room (excluding the searching player if you want)
    const presentPlayers = [];
    for (const role in gameState.players) {
        const player = gameState.players[role];
        if (player.position.x === pos.x && player.position.y === pos.y) {
            presentPlayers.push({ role, disabled: player.disabled });
        }
    }

    return { items: room.items, doors: room.doors, players: presentPlayers };
}


// Advances the turn to the next player.
function advanceTurn(gameState) {
    gameState.currentTurn = (gameState.currentTurn + 1) % gameState.turnOrder.length;
}

server.listen(4000, () => console.log(`Server is running on port ${PORT}`));

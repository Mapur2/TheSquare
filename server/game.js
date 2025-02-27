function initializeGrid() {
    const grid = [];
    const gridSize = 5;

    for (let y = 0; y < gridSize; y++) {
        grid[y] = [];
        for (let x = 0; x < gridSize; x++) {
            const room = {
                doors: {
                    north: { locked: false, permanent: false },
                    east: { locked: false, permanent: false },
                    south: { locked: false, permanent: false },
                    west: { locked: false, permanent: false }
                },
                items: [] // Items available in the room.
            };

            if (y === 0) { // Left edge
                room.doors.south = { locked: true, permanent: true };
            }
            if (y === gridSize - 1) { // Right edge
                room.doors.north = { locked: true, permanent: true };
            }
            if (x === 0) { // Top edge
                room.doors.west = { locked: true, permanent: true };
            }
            if (x === gridSize - 1) { // Bottom edge
                room.doors.east = { locked: true, permanent: true };
            }

            grid[y][x] = room;
        }
    }
    insertItems(grid, gridSize);

    return grid;
}

function insertItems(grid, gridSize) {
    const placeItem = (item) => {
        let placed = false;
        while (!placed) {
            let x = Math.floor(Math.random() * gridSize);
            let y = Math.floor(Math.random() * gridSize);
            // Exclude the starting room (0,0)
            if (x === 0 && y === 0) continue;
            grid[x][y].items.push(item);
            placed = true;
        }
    }

    for (let i = 0; i < 4; i++) {
        placeItem('key');
    }
    for (let i = 0; i < 4; i++) {
        placeItem('screwdriver');
    }
}

function getRandomPosition() {
    let x, y;
    do {
        x = Math.floor(Math.random() * 5);
        y = Math.floor(Math.random() * 5);
    } while (x === 0 && y === 0);
    return { x, y };
}
const createGameState = () => {
    return {
        grid: initializeGrid(), // Our 5x5 grid with proper boundary doors and items.
        players: {
            human: { position: { x: 0, y: 0 }, inventory: [] },
            rook: { position: getRandomPosition(), disabled: false },
            bishop: { position: getRandomPosition(), disabled: false }
        },
        turnOrder: ['human', 'rook', 'bishop'],
        currentTurn: 0, // 0: human's turn, 1: rook's turn, 2: bishop's turn
    }
}
export default createGameState;

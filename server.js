const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

// Configuration
const CONFIG = {
    PORT: process.env.PORT || 5000,
    STATIC_DIR: 'build'
};

// App setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.static(CONFIG.STATIC_DIR));
app.use((req, res) => {
    res.sendFile(path.join(__dirname, CONFIG.STATIC_DIR, 'index.html'));
});

// User management
const userSocketMap = new Map();

function getAllConnectedClients(roomId) {
    try {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        return clients.map((socketId) => ({
            socketId,
            username: userSocketMap.get(socketId)
        }));
    } catch (error) {
        console.error('Error getting connected clients:', error);
        return [];
    }
}

// Socket event handlers
function handleJoin(socket, { roomId, username }) {
    userSocketMap.set(socket.id, username);
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });
}

function handleDisconnect(socket) {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
        socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
            socketId: socket.id,
            username: userSocketMap.get(socket.id),
        });
    });
    userSocketMap.delete(socket.id);
    socket.leave();
}

// Socket.io events
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on(ACTIONS.JOIN, (data) => handleJoin(socket, data));
    
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => handleDisconnect(socket));
});

// Server startup
server.listen(CONFIG.PORT, () => {
    console.log(`Server running on port ${CONFIG.PORT}`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

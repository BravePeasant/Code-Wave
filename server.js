const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const ACTIONS = require('./src/Actions');
const { v4: uuidv4 } = require('uuid');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
    // Map of socketId to username
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
};

// Map to store room data, including files
const roomsData = new Map();

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        
        // Initialize room data if it doesn't exist
        if (!roomsData.has(roomId)) {
            roomsData.set(roomId, {
                roomId,
                files: [{
                    id: uuidv4(),
                    name: 'index.js',
                    content: '// Start coding here...',
                    language: 'javascript',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }],
                activeUsers: []
            });
        }
        
        const roomData = roomsData.get(roomId);
        roomData.activeUsers = getAllConnectedClients(roomId);
        roomsData.set(roomId, roomData);
        
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
                files: roomData.files
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, fileId, code }) => {
        if (!roomsData.has(roomId)) return;
        
        const roomData = roomsData.get(roomId);
        const fileIndex = roomData.files.findIndex(file => file.id === fileId);
        
        if (fileIndex !== -1) {
            roomData.files[fileIndex].content = code;
            roomData.files[fileIndex].updatedAt = Date.now();
            roomsData.set(roomId, roomData);
            
            socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { 
                fileId, 
                code 
            });
        }
    });

    socket.on(ACTIONS.SYNC_CODE, ({ roomId, fileId, socketId }) => {
        if (!roomsData.has(roomId)) return;
        
        const roomData = roomsData.get(roomId);
        const file = roomData.files.find(file => file.id === fileId);
        
        if (file) {
            io.to(socketId).emit(ACTIONS.CODE_CHANGE, { 
                fileId, 
                code: file.content 
            });
        }
    });

    // Handle file creation
    socket.on(ACTIONS.CREATE_FILE, ({ roomId, fileName, language, username }) => {
        if (!roomsData.has(roomId)) return;
        
        const roomData = roomsData.get(roomId);
        const newFile = {
            id: uuidv4(),
            name: fileName,
            content: '',
            language: language || 'javascript',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        roomData.files.push(newFile);
        roomsData.set(roomId, roomData);
        
        io.in(roomId).emit(ACTIONS.FILE_CREATED, {
            file: newFile,
            username
        });
    });

    // Handle file deletion
    socket.on(ACTIONS.DELETE_FILE, ({ roomId, fileId, username }) => {
        if (!roomsData.has(roomId)) return;
        
        const roomData = roomsData.get(roomId);
        roomData.files = roomData.files.filter(file => file.id !== fileId);
        roomsData.set(roomId, roomData);
        
        io.in(roomId).emit(ACTIONS.FILE_DELETED, {
            fileId,
            username
        });
    });

    // Handle file renaming
    socket.on(ACTIONS.RENAME_FILE, ({ roomId, fileId, newName, username }) => {
        if (!roomsData.has(roomId)) return;
        
        const roomData = roomsData.get(roomId);
        const fileIndex = roomData.files.findIndex(file => file.id === fileId);
        
        if (fileIndex !== -1) {
            roomData.files[fileIndex].name = newName;
            roomData.files[fileIndex].updatedAt = Date.now();
            roomsData.set(roomId, roomData);
            
            io.in(roomId).emit(ACTIONS.FILE_RENAMED, {
                fileId,
                newName,
                username
            });
        }
    });

    // Handle file switching (optional - mainly for notifications)
    socket.on(ACTIONS.SWITCH_FILE, ({ roomId, fileId, username }) => {
        io.in(roomId).emit(ACTIONS.FILE_SWITCHED, {
            fileId,
            username
        });
    });

    // Sync all files for a room
    socket.on(ACTIONS.SYNC_FILES, ({ roomId }) => {
        if (!roomsData.has(roomId)) return;
        
        const roomData = roomsData.get(roomId);
        socket.emit(ACTIONS.FILES_SYNCED, {
            files: roomData.files
        });
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
            
            // Update room data if it exists
            if (roomsData.has(roomId)) {
                const roomData = roomsData.get(roomId);
                roomData.activeUsers = roomData.activeUsers.filter(
                    user => user.socketId !== socket.id
                );
                
                // If room is empty, we could clean up
                if (roomData.activeUsers.length === 0) {
                    // Optionally remove room data after some time
                    // For now, we'll keep it for persistence
                    // roomsData.delete(roomId);
                } else {
                    roomsData.set(roomId, roomData);
                }
            }
        });
        
        delete userSocketMap[socket.id];
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

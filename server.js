const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
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

// Room and User management
const userSocketMap = new Map();
const roomFilesMap = new Map();

function getDefaultFile(fileId = uuidv4()) {
    return {
        id: fileId,
        name: 'index.js',
        content: '// Write your code here...',
        language: 'javascript',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

function initializeRoomFiles(roomId) {
    if (!roomFilesMap.has(roomId)) {
        const defaultFile = getDefaultFile();
        roomFilesMap.set(roomId, {
            files: [defaultFile],
            activeFile: defaultFile.id
        });
    }
    return roomFilesMap.get(roomId);
}

function getFilesForRoom(roomId) {
    return initializeRoomFiles(roomId).files;
}

function getActiveFileId(roomId) {
    return initializeRoomFiles(roomId).activeFile;
}

function getFileById(roomId, fileId) {
    const files = getFilesForRoom(roomId);
    return files.find(file => file.id === fileId);
}

function createFile(roomId, filename, language) {
    const roomData = initializeRoomFiles(roomId);
    const newFile = {
        id: uuidv4(),
        name: filename,
        content: '',
        language: language || 'javascript',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    roomData.files.push(newFile);
    return newFile;
}

function deleteFile(roomId, fileId) {
    const roomData = initializeRoomFiles(roomId);
    const fileIndex = roomData.files.findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) return null;
    
    // Don't delete the last file
    if (roomData.files.length === 1) return null;
    
    const deletedFile = roomData.files.splice(fileIndex, 1)[0];
    
    // If we deleted the active file, set another file as active
    if (roomData.activeFile === fileId) {
        roomData.activeFile = roomData.files[0].id;
    }
    
    return deletedFile;
}

function renameFile(roomId, fileId, newName) {
    const file = getFileById(roomId, fileId);
    if (!file) return null;
    
    file.name = newName;
    file.updatedAt = Date.now();
    return file;
}

function updateFileContent(roomId, fileId, content) {
    const file = getFileById(roomId, fileId);
    if (!file) return null;
    
    file.content = content;
    file.updatedAt = Date.now();
    return file;
}

function switchActiveFile(roomId, fileId) {
    const roomData = initializeRoomFiles(roomId);
    const file = getFileById(roomId, fileId);
    
    if (!file) return null;
    
    roomData.activeFile = fileId;
    return file;
}

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
    
    // Initialize room with default file if not exists
    initializeRoomFiles(roomId);
    
    const clients = getAllConnectedClients(roomId);
    const files = getFilesForRoom(roomId);
    const activeFileId = getActiveFileId(roomId);
    
    // Notify all clients in the room that a new user joined
    clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });
    
    // Send the list of files to the new user
    socket.emit(ACTIONS.FILES_SYNCED, {
        files,
        activeFileId
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
    
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, fileId, code }) => {
        updateFileContent(roomId, fileId, code);
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { fileId, code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, fileId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { fileId, code });
    });
    
    socket.on(ACTIONS.CREATE_FILE, ({ roomId, filename, language }) => {
        const newFile = createFile(roomId, filename, language);
        io.in(roomId).emit(ACTIONS.FILE_CREATED, { file: newFile });
    });
    
    socket.on(ACTIONS.DELETE_FILE, ({ roomId, fileId }) => {
        const deletedFile = deleteFile(roomId, fileId);
        if (deletedFile) {
            const activeFileId = getActiveFileId(roomId);
            io.in(roomId).emit(ACTIONS.FILE_DELETED, { 
                fileId, 
                activeFileId 
            });
        }
    });
    
    socket.on(ACTIONS.RENAME_FILE, ({ roomId, fileId, newName }) => {
        const updatedFile = renameFile(roomId, fileId, newName);
        if (updatedFile) {
            io.in(roomId).emit(ACTIONS.FILE_RENAMED, { 
                fileId, 
                newName 
            });
        }
    });
    
    socket.on(ACTIONS.SWITCH_FILE, ({ roomId, fileId }) => {
        const file = switchActiveFile(roomId, fileId);
        if (file) {
            socket.emit(ACTIONS.FILE_SWITCHED, { 
                fileId, 
                content: file.content 
            });
        }
    });
    
    socket.on(ACTIONS.SYNC_FILES, ({ roomId, socketId }) => {
        const files = getFilesForRoom(roomId);
        const activeFileId = getActiveFileId(roomId);
        io.to(socketId).emit(ACTIONS.FILES_SYNCED, { 
            files, 
            activeFileId 
        });
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

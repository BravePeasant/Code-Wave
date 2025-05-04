import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import MultiEditor from '../components/MultiEditor';
import Sidebar from '../components/Sidebar';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    useParams,
    Navigate,
} from 'react-router-dom';
import ACTIONS from '../Actions';

const EditorPage = () => {
    const socketRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                socketRef.current = await initSocket();
                
                // Handle successful connection
                socketRef.current.on('connect', () => {
                    console.log('Socket connected successfully');
                    setSocketConnected(true);
                    
                    // Join room after connection is established
                    socketRef.current.emit(ACTIONS.JOIN, {
                        roomId,
                        username: location.state?.username,
                    });
                    
                    // Request initial files
                    socketRef.current.emit(ACTIONS.SYNC_FILES, { roomId });
                });
                
                // Set up error handlers
                socketRef.current.on('connect_error', (err) => handleErrors(err));
                socketRef.current.on('connect_failed', (err) => handleErrors(err));
                socketRef.current.on('disconnect', () => {
                    console.log('Socket disconnected');
                    setSocketConnected(false);
                });

                function handleErrors(e) {
                    console.log('socket error', e);
                    toast.error('Socket connection failed, try again later.');
                    setSocketConnected(false);
                }

                // Listening for joined event
                socketRef.current.on(
                    ACTIONS.JOINED,
                    ({ clients, username, socketId, files }) => {
                        if (username !== location.state?.username) {
                            toast.success(`${username} joined the room.`);
                        }
                        setClients(clients);
                        
                        // Initialize files from server
                        if (files && files.length > 0) {
                            setFiles(files);
                            if (!activeFileId) {
                                setActiveFileId(files[0].id);
                            }
                        }
                    }
                );

                // Listening for disconnected
                socketRef.current.on(
                    ACTIONS.DISCONNECTED,
                    ({ socketId, username }) => {
                        toast.success(`${username} left the room.`);
                        setClients((prev) => {
                            return prev.filter(
                                (client) => client.socketId !== socketId
                            );
                        });
                    }
                );

                // Code change event
                socketRef.current.on(
                    ACTIONS.CODE_CHANGE,
                    ({ fileId, code }) => {
                        // Only update the file content in our local state
                        setFiles(prev => 
                            prev.map(file => 
                                file.id === fileId 
                                    ? { ...file, content: code }
                                    : file
                            )
                        );
                    }
                );

                // File created event
                socketRef.current.on(
                    ACTIONS.FILE_CREATED,
                    ({ file, username }) => {
                        toast.success(`${username} created a new file: ${file.name}`);
                        setFiles((prev) => {
                            const newFiles = [...prev, file];
                            
                            // If this is the first file, set it as active
                            if (prev.length === 0) {
                                setActiveFileId(file.id);
                            }
                            
                            return newFiles;
                        });
                    }
                );

                // File deleted event
                socketRef.current.on(
                    ACTIONS.FILE_DELETED,
                    ({ fileId, username }) => {
                        toast.success(`${username} deleted a file`);
                        setFiles((prev) => {
                            const remainingFiles = prev.filter(file => file.id !== fileId);
                            
                            // If active file was deleted, switch to another file
                            if (activeFileId === fileId && remainingFiles.length > 0) {
                                setActiveFileId(remainingFiles[0].id);
                            } else if (remainingFiles.length === 0) {
                                setActiveFileId(null);
                            }
                            
                            return remainingFiles;
                        });
                    }
                );

                // File renamed event
                socketRef.current.on(
                    ACTIONS.FILE_RENAMED,
                    ({ fileId, newName, username }) => {
                        toast.success(`${username} renamed a file to ${newName}`);
                        setFiles((prev) => 
                            prev.map(file => 
                                file.id === fileId 
                                    ? { ...file, name: newName }
                                    : file
                            )
                        );
                    }
                );

                // Sync files with server
                socketRef.current.on(
                    ACTIONS.FILES_SYNCED,
                    ({ files }) => {
                        if (files && files.length > 0) {
                            setFiles(files);
                            if (!activeFileId) {
                                setActiveFileId(files[0].id);
                            }
                        }
                    }
                );
                
                // Handle code sync response
                socketRef.current.on(
                    ACTIONS.CODE_SYNCED,
                    ({ fileId, code }) => {
                        // Update our local file state with the latest code from server
                        setFiles(prev => 
                            prev.map(file => 
                                file.id === fileId 
                                    ? { ...file, content: code }
                                    : file
                            )
                        );
                    }
                );
                
            } catch (err) {
                console.error("Socket initialization error:", err);
                toast.error('Failed to connect to the collaboration server');
                setSocketConnected(false);
            }
        };
        
        init();
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.off(ACTIONS.FILE_CREATED);
                socketRef.current.off(ACTIONS.FILE_DELETED);
                socketRef.current.off(ACTIONS.FILE_RENAMED);
                socketRef.current.off(ACTIONS.FILE_SWITCHED);
                socketRef.current.off(ACTIONS.FILES_SYNCED);
                socketRef.current.off(ACTIONS.CODE_SYNCED);
                socketRef.current.off('connect');
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
                socketRef.current.off('disconnect');
            }
        };
    }, [roomId, location.state?.username]);

    // Try reconnecting socket
    const reconnectSocket = async () => {
        try {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            
            toast.success('Reconnecting to server...');
            
            socketRef.current = await initSocket();
            
        } catch (err) {
            console.error("Reconnection failed:", err);
            toast.error('Reconnection failed');
            setSocketConnected(false);
        }
    };

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    // File management functions
    const createNewFile = (fileName, language) => {
        if (!socketRef.current || !socketConnected) {
            toast.error('Not connected to server. Trying to reconnect...');
            reconnectSocket();
            return;
        }
        
        try {
            console.log('Creating new file:', fileName, language);
            socketRef.current.emit(ACTIONS.CREATE_FILE, {
                roomId,
                fileName,
                language,
                username: location.state?.username,
            });
        } catch (err) {
            console.error("Error creating file:", err);
            toast.error('Failed to create file. Please try again.');
        }
    };

    const deleteFile = (fileId) => {
        if (!socketRef.current || !socketConnected) {
            toast.error('Not connected to server. Trying to reconnect...');
            reconnectSocket();
            return;
        }
        
        socketRef.current.emit(ACTIONS.DELETE_FILE, {
            roomId,
            fileId,
            username: location.state?.username,
        });
    };

    const renameFile = (fileId, newName) => {
        if (!socketRef.current || !socketConnected) {
            toast.error('Not connected to server. Trying to reconnect...');
            reconnectSocket();
            return;
        }
        
        socketRef.current.emit(ACTIONS.RENAME_FILE, {
            roomId,
            fileId,
            newName,
            username: location.state?.username,
        });
    };

    const switchFile = (fileId) => {
        // Just switch the active file in the UI
        if (fileId !== activeFileId) {
            setActiveFileId(fileId);
        }
    };

    // Handle code changes from the editor for any file
    const handleCodeChange = (fileId, code) => {
        // Update our local file state
        setFiles(prev => 
            prev.map(file => 
                file.id === fileId
                    ? { ...file, content: code }
                    : file
            )
        );
        
        // Send code change to the server
        if (socketRef.current && socketConnected) {
            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                roomId,
                fileId,
                code,
            });
        }
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <Sidebar
                clients={clients}
                files={files}
                activeFileId={activeFileId}
                onSwitchFile={switchFile}
                onRenameFile={renameFile}
                onDeleteFile={deleteFile}
                onCreateFile={createNewFile}
                onCopyRoomId={copyRoomId}
                onLeaveRoom={leaveRoom}
                socketConnected={socketConnected}
                onReconnect={reconnectSocket}
                roomId={roomId}
            />
            <div className="editorWrap">
                {files.length > 0 ? (
                    <MultiEditor
                        socketRef={socketRef}
                        roomId={roomId}
                        onCodeChange={handleCodeChange}
                        files={files}
                        activeFileId={activeFileId}
                        socketConnected={socketConnected}
                    />
                ) : (
                    <div className="noFileMessage">
                        <h2>No files yet</h2>
                        <p>Create a new file to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorPage;
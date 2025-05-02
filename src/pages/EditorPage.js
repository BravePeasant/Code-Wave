import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import Editor from '../components/Editor';
import FileList from '../components/FileList';
import FileActions from '../components/FileActions';
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
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId, files }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                    }
                    setClients(clients);
                    
                    // Initialize files from server
                    setFiles(files);
                    if (files.length > 0 && !activeFileId) {
                        setActiveFileId(files[0].id);
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

            // File created event
            socketRef.current.on(
                ACTIONS.FILE_CREATED,
                ({ file, username }) => {
                    toast.success(`${username} created a new file: ${file.name}`);
                    setFiles((prev) => [...prev, file]);
                    
                    // If this is the first file, set it as active
                    if (files.length === 0) {
                        setActiveFileId(file.id);
                    }
                }
            );

            // File deleted event
            socketRef.current.on(
                ACTIONS.FILE_DELETED,
                ({ fileId, username }) => {
                    toast.success(`${username} deleted a file`);
                    setFiles((prev) => prev.filter(file => file.id !== fileId));
                    
                    // If active file was deleted, switch to another file
                    if (activeFileId === fileId) {
                        const remainingFiles = files.filter(file => file.id !== fileId);
                        if (remainingFiles.length > 0) {
                            setActiveFileId(remainingFiles[0].id);
                        } else {
                            setActiveFileId(null);
                        }
                    }
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

            // File switched event - not needed for local state changes
            socketRef.current.on(
                ACTIONS.FILE_SWITCHED,
                ({ fileId, username }) => {
                    // This is optional - you could show a toast when someone switches files
                    if (username !== location.state?.username) {
                        const fileName = files.find(f => f.id === fileId)?.name || 'unknown';
                        toast.info(`${username} is now viewing ${fileName}`);
                    }
                }
            );

            // Sync files with server
            socketRef.current.on(
                ACTIONS.FILES_SYNCED,
                ({ files }) => {
                    setFiles(files);
                    if (files.length > 0 && !activeFileId) {
                        setActiveFileId(files[0].id);
                    }
                }
            );
        };
        init();
        return () => {
            socketRef.current?.disconnect();
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
            socketRef.current?.off(ACTIONS.FILE_CREATED);
            socketRef.current?.off(ACTIONS.FILE_DELETED);
            socketRef.current?.off(ACTIONS.FILE_RENAMED);
            socketRef.current?.off(ACTIONS.FILE_SWITCHED);
            socketRef.current?.off(ACTIONS.FILES_SYNCED);
        };
    }, []);

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
        socketRef.current.emit(ACTIONS.CREATE_FILE, {
            roomId,
            fileName,
            language,
            username: location.state?.username,
        });
    };

    const deleteFile = (fileId) => {
        socketRef.current.emit(ACTIONS.DELETE_FILE, {
            roomId,
            fileId,
            username: location.state?.username,
        });
    };

    const renameFile = (fileId, newName) => {
        socketRef.current.emit(ACTIONS.RENAME_FILE, {
            roomId,
            fileId,
            newName,
            username: location.state?.username,
        });
    };

    const switchFile = (fileId) => {
        setActiveFileId(fileId);
        socketRef.current.emit(ACTIONS.SWITCH_FILE, {
            roomId,
            fileId,
            username: location.state?.username,
        });
    };

    // Get the active file
    const activeFile = files.find(file => file.id === activeFileId) || null;

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                    
                    <h3>Files</h3>
                    <FileList 
                        files={files}
                        activeFileId={activeFileId}
                        onSwitchFile={switchFile}
                        onRenameFile={renameFile}
                        onDeleteFile={deleteFile}
                    />
                    
                    <FileActions 
                        onCreateFile={createNewFile}
                    />
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                {activeFile ? (
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        onCodeChange={(code) => {
                            codeRef.current = code;
                        }}
                        file={activeFile}
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

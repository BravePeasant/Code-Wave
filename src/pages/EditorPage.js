import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';

// Constants
const TOAST_CONFIG = {
    success: { duration: 2000 },
    error: { duration: 3000 }
};

const EditorPage = () => {
    // Refs
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    
    // Hooks
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    
    // State
    const [clients, setClients] = useState([]);
    const [socketError, setSocketError] = useState(null);

    // Socket Event Handlers
    const handleJoined = ({ clients: updatedClients, username: joinedUsername, socketId }) => {
        if (joinedUsername !== location.state?.username) {
            toast.success(`${joinedUsername} joined the room.`, TOAST_CONFIG.success);
        }
        setClients(updatedClients);
        
        if (socketRef.current.id !== socketId) {
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
                code: codeRef.current,
                socketId,
            });
        }
    };

    const handleDisconnected = ({ socketId, username: leftUsername }) => {
        toast.error(`${leftUsername} left the room.`, TOAST_CONFIG.error);
        setClients(prev => prev.filter(client => client.socketId !== socketId));
    };

    const handleErrors = (e, context = 'Socket Error') => {
        console.error(context, e);
        const message = e.message || 'Socket connection failed, please try again later.';
        setSocketError(message);
        toast.error(message, TOAST_CONFIG.error);
    };

    // Socket Initialization
    useEffect(() => {
        let isMounted = true;

        const initializeSocket = async () => {
            try {
                socketRef.current = await initSocket();

                // Error handlers
                socketRef.current.on('connect_error', err => handleErrors(err, 'Connection Error'));
                socketRef.current.on('connect_failed', err => handleErrors(err, 'Connection Failed'));
                socketRef.current.on('disconnect', reason => {
                    if (isMounted) {
                        console.log('Socket disconnected:', reason);
                    }
                });

                // Room events
                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                socketRef.current.on(ACTIONS.JOINED, handleJoined);
                socketRef.current.on(ACTIONS.DISCONNECTED, handleDisconnected);

            } catch (err) {
                handleErrors(err, 'Initialization Failed');
            }
        };

        initializeSocket();

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
                ['connect_error', 'connect_failed', 'disconnect', ACTIONS.JOINED, ACTIONS.DISCONNECTED]
                    .forEach(event => socketRef.current.off(event));
            }
        };
    }, [location.state?.username, roomId]);

    // Utility Functions
    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied to clipboard', TOAST_CONFIG.success);
        } catch (err) {
            toast.error('Failed to copy Room ID', TOAST_CONFIG.error);
            console.error('Clipboard copy error:', err);
        }
    };

    const leaveRoom = () => reactNavigator('/');

    // Guards
    if (!location.state?.username) {
        return <Navigate to="/" replace />;
    }

    if (socketError) {
        return (
            <div className="errorOverlay">
                <h2>Connection Error</h2>
                <p>{socketError}</p>
                <button onClick={() => window.location.reload()} className="btn">Try Again</button>
                <button onClick={() => reactNavigator('/')} className="btn leaveBtn">Go Home</button>
            </div>
        );
    }

    // Render
    return (
        <div className="mainWrap">
            <aside className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/code-wave.png" alt="CodeWave Logo" />
                    </div>
                    <h3>Connected Users</h3>
                    <div className="clientsList">
                        {clients.map(client => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <div className="asideButtons">
                    <button className="btn copyBtn" onClick={copyRoomId}>Copy Room ID</button>
                    <button className="btn leaveBtn" onClick={leaveRoom}>Leave Room</button>
                </div>
            </aside>
            <main className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={code => { codeRef.current = code; }}
                />
            </main>
        </div>
    );
};

export default EditorPage;

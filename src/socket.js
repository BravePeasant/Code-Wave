import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket'],
        autoConnect: true
    };
    
    // Make sure the backend URL is properly set
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    console.log('Connecting to:', BACKEND_URL);
    return io(BACKEND_URL, options);
};
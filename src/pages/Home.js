import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Constants
const PATHS = {
    LOGO: '/code-wave.png',
    EDITOR: '/editor',
};

const MESSAGES = {
    ROOM_CREATED: 'New room created successfully!',
    VALIDATION_ERROR: 'Room ID and Username are required.',
};

const Home = () => {
    // Hooks
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        roomId: '',
        username: '',
    });
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const createNewRoom = (e) => {
        e.preventDefault();
        setIsCreating(true);
        
        // Simulate a slight delay for animation
        setTimeout(() => {
            const id = uuidV4();
            setFormData(prev => ({ ...prev, roomId: id }));
            toast.success(MESSAGES.ROOM_CREATED, {
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                }
            });
            setIsCreating(false);
        }, 600);
    };

    const handleJoinRoomSubmit = (e) => {
        e.preventDefault();
        const { roomId, username } = formData;

        if (!roomId || !username) {
            toast.error(MESSAGES.VALIDATION_ERROR, {
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                }
            });
            return;
        }

        setIsJoining(true);
        
        // Simulate a slight delay for animation
        setTimeout(() => {
            navigate(`${PATHS.EDITOR}/${roomId}`, {
                state: { username },
            });
        }, 600);
    };

    // Component parts
    const renderHeader = () => (
        <>
            <img
                className="homePageLogo"
                src={PATHS.LOGO}
                alt="CodeWave Logo"
            />
            <h4 className="mainLabel">Join or Create a Room</h4>
        </>
    );

    const renderForm = () => (
        <form className="inputGroup" onSubmit={handleJoinRoomSubmit}>
            <InputField
                id="roomIdInput"
                name="roomId"
                placeholder="Room ID"
                value={formData.roomId}
                onChange={handleInputChange}
                icon="🔑"
            />

            <InputField
                id="usernameInput"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                icon="👤"
            />

            <button 
                type="submit" 
                className={`btn joinBtn ${isJoining ? 'success' : ''}`}
                disabled={isJoining}
            >
                {isJoining ? 'Joining...' : 'Join'}
            </button>

            <span className="createInfo">
                Don't have an invite?&nbsp;
                <button
                    type="button"
                    onClick={createNewRoom}
                    className="btn-link createNewBtn"
                    disabled={isCreating}
                >
                    {isCreating ? 'Creating...' : 'Create a new room'}
                </button>
            </span>
        </form>
    );

    // Main render
    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                {renderHeader()}
                {renderForm()}
            </div>
            <footer>
                <h4>CodeWave: Real-time Collaborative Coding</h4>
            </footer>
        </div>
    );
};

// Helper component for input fields with icon
const InputField = ({ id, name, placeholder, value, onChange, icon }) => (
    <div className="inputFieldWrapper">
        {icon && <span className="inputIcon">{icon}</span>}
        <label htmlFor={id} className="visually-hidden">
            {placeholder}
        </label>
        <input
            id={id}
            name={name}
            type="text"
            className="inputBox"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required
        />
    </div>
);

export default Home;
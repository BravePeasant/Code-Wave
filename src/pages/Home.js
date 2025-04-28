import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Constants
const PATHS = {
    LOGO: '/code-wave.png',
    EDITOR: '/editor',
};

const MESSAGES = {
    ROOM_CREATED: 'Created a new room',
    VALIDATION_ERROR: 'Room ID and Username are required.',
};

const Home = () => {
    // Hooks
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        roomId: '',
        username: '',
    });

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
        const id = uuidV4();
        setFormData(prev => ({ ...prev, roomId: id }));
        toast.success(MESSAGES.ROOM_CREATED);
    };

    const handleJoinRoomSubmit = (e) => {
        e.preventDefault();
        const { roomId, username } = formData;

        if (!roomId || !username) {
            toast.error(MESSAGES.VALIDATION_ERROR);
            return;
        }

        navigate(`${PATHS.EDITOR}/${roomId}`, {
            state: { username },
        });
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
            />

            <InputField
                id="usernameInput"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
            />

            <button type="submit" className="btn joinBtn">
                Join
            </button>

            <span className="createInfo">
                Don't have an invite?&nbsp;
                <button
                    type="button"
                    onClick={createNewRoom}
                    className="btn-link createNewBtn"
                >
                    Create a new room
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

// Helper component for input fields
const InputField = ({ id, name, placeholder, value, onChange }) => (
    <>
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
    </>
);

export default Home;

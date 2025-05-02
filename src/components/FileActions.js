import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';

const FileActions = ({ socketRef, roomId }) => {
    const [showNewFileForm, setShowNewFileForm] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [fileType, setFileType] = useState('javascript');
    
    // File type options with their extensions
    const fileTypes = [
        { value: 'javascript', label: 'JavaScript', extension: '.js' },
        { value: 'html', label: 'HTML', extension: '.html' },
        { value: 'css', label: 'CSS', extension: '.css' },
        { value: 'json', label: 'JSON', extension: '.json' },
        { value: 'markdown', label: 'Markdown', extension: '.md' }
    ];
    
    // Handler to create a new file
    const handleCreateFile = () => {
        if (newFileName.trim() === '') {
            toast.error('File name cannot be empty');
            return;
        }
        
        // Get selected file type
        const selectedType = fileTypes.find(type => type.value === fileType);
        
        // Add extension if not already present
        let filename = newFileName;
        if (!filename.includes('.')) {
            filename += selectedType.extension;
        }
        
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.CREATE_FILE, {
                roomId,
                filename,
                language: fileType
            });
            
            toast.success(`Created new file: ${filename}`);
            setNewFileName('');
            setShowNewFileForm(false);
        }
    };
    
    // Cancel new file creation
    const cancelNewFile = () => {
        setShowNewFileForm(false);
        setNewFileName('');
    };
    
    return (
        <div className="file-actions">
            {showNewFileForm ? (
                <div className="new-file-form">
                    <input
                        type="text"
                        placeholder="Enter file name"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFile();
                            if (e.key === 'Escape') cancelNewFile();
                        }}
                        autoFocus
                        className="inputBox"
                    />
                    
                    <select 
                        value={fileType}
                        onChange={(e) => setFileType(e.target.value)}
                        className="inputBox"
                    >
                        {fileTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    
                    <div className="file-form-actions">
                        <button 
                            onClick={handleCreateFile}
                            className="btn actionBtn"
                        >
                            Create
                        </button>
                        <button 
                            onClick={cancelNewFile}
                            className="btn leaveBtn"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setShowNewFileForm(true)}
                    className="btn actionBtn new-file-btn"
                >
                    + New File
                </button>
            )}
        </div>
    );
};

export default FileActions;
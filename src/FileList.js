import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';

const FileList = ({ files, activeFileId, socketRef, roomId }) => {
    const [editingFileId, setEditingFileId] = useState(null);
    const [newFileName, setNewFileName] = useState('');
    
    // Handler to switch to a different file
    const handleFileClick = (fileId) => {
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.SWITCH_FILE, {
                roomId,
                fileId
            });
        }
    };
    
    // Handler to start renaming a file
    const startRenaming = (fileId, currentName) => {
        setEditingFileId(fileId);
        setNewFileName(currentName);
    };
    
    // Handler to save renamed file
    const saveFileName = (fileId) => {
        if (newFileName.trim() === '') {
            toast.error('File name cannot be empty');
            return;
        }
        
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.RENAME_FILE, {
                roomId,
                fileId,
                newName: newFileName
            });
        }
        
        setEditingFileId(null);
        setNewFileName('');
    };
    
    // Handler to delete a file
    const handleDeleteFile = (fileId) => {
        if (files.length <= 1) {
            toast.error('Cannot delete the only file in the project');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this file?')) {
            if (socketRef.current) {
                socketRef.current.emit(ACTIONS.DELETE_FILE, {
                    roomId,
                    fileId
                });
            }
        }
    };
    
    // Get file icon based on file extension
    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'js':
            case 'jsx':
                return '📄 JS';
            case 'html':
                return '📄 HTML';
            case 'css':
                return '📄 CSS';
            case 'json':
                return '📄 JSON';
            case 'md':
                return '📄 MD';
            default:
                return '📄';
        }
    };
    
    return (
        <div className="file-list">
            <h3>Files</h3>
            <ul className="files">
                {files.map((file) => (
                    <li 
                        key={file.id} 
                        className={`file-item ${file.id === activeFileId ? 'active' : ''}`}
                    >
                        {editingFileId === file.id ? (
                            <div className="file-rename">
                                <input
                                    type="text"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveFileName(file.id);
                                        if (e.key === 'Escape') setEditingFileId(null);
                                    }}
                                    autoFocus
                                />
                                <button 
                                    onClick={() => saveFileName(file.id)}
                                    className="btn btn-sm"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div className="file-info">
                                <span 
                                    className="file-name"
                                    onClick={() => handleFileClick(file.id)}
                                >
                                    <span className="file-icon">{getFileIcon(file.name)}</span>
                                    {file.name}
                                </span>
                                <div className="file-actions">
                                    <button 
                                        className="btn-icon"
                                        onClick={() => startRenaming(file.id, file.name)}
                                        aria-label="Rename file"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="btn-icon"
                                        onClick={() => handleDeleteFile(file.id)}
                                        aria-label="Delete file"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileList;

import React, { useState } from 'react';

const FileList = ({ 
    files, 
    activeFileId, 
    onSwitchFile, 
    onRenameFile, 
    onDeleteFile,
    onDownloadFile 
}) => {
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [fileToRename, setFileToRename] = useState(null);
    const [newFileName, setNewFileName] = useState('');

    const handleRenameClick = (e, file) => {
        e.stopPropagation(); // Prevent file switching when clicking rename
        setFileToRename(file);
        setNewFileName(file.name);
        setShowRenameModal(true);
    };

    const handleDeleteClick = (e, fileId) => {
        e.stopPropagation(); // Prevent file switching when clicking delete
        if (window.confirm('Are you sure you want to delete this file?')) {
            onDeleteFile(fileId);
        }
    };
    
    const handleDownloadClick = (e, fileId) => {
        e.stopPropagation(); // Prevent file switching when clicking download
        if (onDownloadFile) {
            onDownloadFile(fileId);
        }
    };

    const handleRenameSubmit = (e) => {
        e.preventDefault();
        if (newFileName.trim() && fileToRename) {
            onRenameFile(fileToRename.id, newFileName.trim());
            setShowRenameModal(false);
        }
    };

    const closeRenameModal = () => {
        setShowRenameModal(false);
        setFileToRename(null);
    };

    const getFileIcon = (language) => {
        switch (language) {
            case 'javascript':
                return 'JS';
            case 'css':
                return 'CSS';
            case 'html':
                return 'HTML';
            case 'typescript':
                return 'TS';
            case 'python':
                return 'PY';
            case 'java':
                return 'JV';
            case 'markdown':
                return 'MD';
            default:
                return 'TXT';
        }
    };

    return (
        <div className="fileList">
            {files.length === 0 ? (
                <div className="noFiles">No files available</div>
            ) : (
                files.map((file) => (
                    <div
                        key={file.id}
                        className={`fileItem ${file.id === activeFileId ? 'active' : ''}`}
                        onClick={() => onSwitchFile(file.id)}
                    >
                        <div className="fileName">
                            <span className="fileIcon">{getFileIcon(file.language)}</span> {file.name}
                        </div>
                        <div className="fileActions">
                            <button
                                className="fileActionBtn"
                                onClick={(e) => handleDownloadClick(e, file.id)}
                                title="Download file"
                            >
                                💾
                            </button>
                            <button
                                className="fileActionBtn"
                                onClick={(e) => handleRenameClick(e, file)}
                                title="Rename file"
                            >
                                ✏️
                            </button>
                            <button
                                className="fileActionBtn"
                                onClick={(e) => handleDeleteClick(e, file.id)}
                                title="Delete file"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))
            )}

            {/* Rename File Modal */}
            {showRenameModal && (
                <div className="renameFileModal">
                    <div className="renameFileContent">
                        <div className="renameFileHeader">
                            <h3 className="renameFileTitle">Rename File</h3>
                            <button className="renameFileClose" onClick={closeRenameModal}>×</button>
                        </div>
                        <form onSubmit={handleRenameSubmit}>
                            <input
                                type="text"
                                className="renameFileInput"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                autoFocus
                            />
                            <div className="renameFileButtons">
                                <button type="button" className="renameFileCancel" onClick={closeRenameModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="renameFileSave">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileList;
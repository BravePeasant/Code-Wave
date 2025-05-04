import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Client from './Client';
import FileList from './FileList';
import FileActions from './FileActions';
import { downloadFile, downloadAllFiles, saveToLocalStorage } from '../utils/FileUtils';

const Sidebar = ({ 
    clients, 
    files, 
    activeFileId, 
    onSwitchFile, 
    onRenameFile, 
    onDeleteFile, 
    onCreateFile, 
    onCopyRoomId, 
    onLeaveRoom,
    socketConnected,
    onReconnect,
    roomId
}) => {
    const [activeTab, setActiveTab] = useState('files'); // 'files' or 'users'
    
    return (
        <div className="aside">
            <div className="asideInner">
                <div className="logo">
                    <img
                        className="logoImage"
                        src="/code-wave.png"
                        alt="logo"
                    />
                    {!socketConnected && (
                        <div className="connectionStatus disconnected">
                            Disconnected
                            <button className="reconnectBtn" onClick={onReconnect}>
                                Reconnect
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Tab Navigation */}
                <div className="tabNavigation">
                    <button 
                        className={`tabButton ${activeTab === 'files' ? 'active' : ''}`}
                        onClick={() => setActiveTab('files')}
                    >
                        Files ({files.length})
                    </button>
                    <button 
                        className={`tabButton ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users ({clients.length})
                    </button>
                </div>
                
                {/* Files Tab Content */}
                {activeTab === 'files' && (
                    <div className="tabContent">
                        <FileList 
                            files={files}
                            activeFileId={activeFileId}
                            onSwitchFile={onSwitchFile}
                            onRenameFile={onRenameFile}
                            onDeleteFile={onDeleteFile}
                            onDownloadFile={(fileId) => {
                                const fileToDownload = files.find(f => f.id === fileId);
                                if (fileToDownload) downloadFile(fileToDownload);
                            }}
                        />
                        <FileActions onCreateFile={onCreateFile} />
                        
                        {/* File Save Options */}
                        {files.length > 0 && (
                            <div className="fileSaveOptions">
                                <button 
                                    className="fileSaveBtn"
                                    onClick={() => downloadAllFiles(files, roomId)}
                                >
                                    Download All Files
                                </button>
                                <button 
                                    className="fileSaveBtn"
                                    onClick={() => {
                                        saveToLocalStorage(files, roomId);
                                        toast.success('Files saved to browser storage');
                                    }}
                                >
                                    Save to Browser
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Users Tab Content */}
                {activeTab === 'users' && (
                    <div className="tabContent">
                        <div className="clientsList">
                            {clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.username}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="sidebarFooter">
                <button className="btn copyBtn" onClick={onCopyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={onLeaveRoom}>
                    Leave
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
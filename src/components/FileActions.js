import React, { useState } from 'react';

const FileActions = ({ onCreateFile }) => {
    const [showForm, setShowForm] = useState(false);
    const [fileName, setFileName] = useState('');
    const [language, setLanguage] = useState('javascript');

    const handleCreateFile = (e) => {
        e.preventDefault();
        
        if (fileName.trim()) {
            onCreateFile(fileName.trim(), language);
            resetForm();
        }
    };

    const resetForm = () => {
        setFileName('');
        setLanguage('javascript');
        setShowForm(false);
    };

    return (
        <div className="fileActions">
            {!showForm ? (
                <button 
                    className="addFileBtn" 
                    onClick={() => setShowForm(true)}
                >
                    + New File
                </button>
            ) : (
                <form className="addFileForm" onSubmit={handleCreateFile}>
                    <input
                        type="text"
                        className="addFileInput"
                        placeholder="File name"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        autoFocus
                    />
                    <div className="addFileFormRow">
                        <select
                            className="languageSelect"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="css">CSS</option>
                            <option value="html">HTML</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="markdown">Markdown</option>
                            <option value="text">Plain Text</option>
                        </select>
                    </div>
                    <div className="addFileFormRow">
                        <button type="submit" className="addFileBtn">
                            Create
                        </button>
                    </div>
                    <div className="addFileFormRow">
                        <button 
                            type="button" 
                            className="addFileBtn" 
                            style={{ background: '#444' }}
                            onClick={resetForm}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default FileActions;

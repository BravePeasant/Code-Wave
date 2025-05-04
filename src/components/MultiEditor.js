import React, { useState, useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/python/python';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const MultiEditor = ({ socketRef, roomId, onCodeChange, files, activeFileId, socketConnected }) => {
    // Map to store editor instances for each file
    const editorsRef = useRef(new Map());
    
    // Keep track of which editors have been initialized
    const [initializedEditors, setInitializedEditors] = useState(new Set());
    
    // Get the active file
    const activeFile = files.find(file => file.id === activeFileId);

    useEffect(() => {
        // Clean up editors when component unmounts
        return () => {
            // Convert Map to array for iteration during cleanup
            Array.from(editorsRef.current.entries()).forEach(([fileId, editor]) => {
                if (editor && editor.toTextArea) {
                    editor.toTextArea();
                }
            });
            editorsRef.current.clear();
        };
    }, []);

    // Initialize editor for a file if it hasn't been initialized yet
    const initializeEditor = (file) => {
        // Skip if this editor is already initialized
        if (initializedEditors.has(file.id)) return;
        
        const editorId = `editor-${file.id}`;
        const textArea = document.getElementById(editorId);
        
        if (!textArea) return; // Element might not be in DOM yet
        
        const editor = Codemirror.fromTextArea(textArea, {
            mode: getCodeMirrorMode(file.language),
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
        });
        
        // Set initial content
        editor.setValue(file.content || '');
        
        // Handle code changes
        editor.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            
            // Only emit changes if they're from user input
            if (origin !== 'setValue') {
                onCodeChange(file.id, code);
            }
        });
        
        // Store editor instance in ref
        editorsRef.current.set(file.id, editor);
        
        // Mark as initialized
        setInitializedEditors(prev => new Set([...prev, file.id]));
        
        // Request latest code from server
        if (socketRef.current && socketConnected) {
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
                roomId,
                fileId: file.id,
                socketId: socketRef.current.id,
            });
        }
    };
    
    // Listen for code changes from server
    useEffect(() => {
        if (!socketRef.current) return;
        
        const handleCodeChange = ({ fileId, code }) => {
            // Update editor content if we have an instance for this file
            const editor = editorsRef.current.get(fileId);
            if (editor) {
                const currentValue = editor.getValue();
                if (currentValue !== code) {
                    editor.setValue(code);
                }
            }
        };
        
        socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
        socketRef.current.on(ACTIONS.CODE_SYNCED, handleCodeChange);
        
        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
            socketRef.current.off(ACTIONS.CODE_SYNCED, handleCodeChange);
        };
    }, [socketRef.current]);
    
    // Update editor when file content or language changes
    useEffect(() => {
        files.forEach(file => {
            const editor = editorsRef.current.get(file.id);
            if (editor) {
                // Update mode if needed
                editor.setOption('mode', getCodeMirrorMode(file.language));
                
                // Check if content needs updating (avoid loops)
                const currentValue = editor.getValue();
                if (currentValue !== file.content) {
                    editor.setValue(file.content || '');
                }
            }
        });
    }, [files]);
    
    // Helper function to get the appropriate CodeMirror mode
    const getCodeMirrorMode = (language) => {
        switch (language) {
            case 'javascript':
                return 'javascript';
            case 'css':
                return 'css';
            case 'html':
                return 'xml';
            case 'python':
                return 'python';
            case 'java':
                return 'text/x-java';
            case 'typescript':
                return 'text/typescript';
            case 'markdown':
                return 'markdown';
            default:
                return 'javascript';
        }
    };
    
    // Layout style to show only the active editor
    const getEditorStyle = (fileId) => {
        return {
            display: fileId === activeFileId ? 'block' : 'none',
            height: '100%'
        };
    };

    return (
        <div className="multiEditorContainer" style={{ height: '100%' }}>
            {files.map(file => (
                <div 
                    key={file.id} 
                    className="editorContainer" 
                    style={getEditorStyle(file.id)}
                    ref={() => initializeEditor(file)}
                >
                    <textarea id={`editor-${file.id}`}></textarea>
                </div>
            ))}
        </div>
    );
};

export default MultiEditor;
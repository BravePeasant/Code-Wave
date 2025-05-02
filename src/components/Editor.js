import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/base16-light.css'; 
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, activeFile, onCodeChange }) => {
    const editorRef = useRef(null);
    
    // Set editor mode based on file type
    const getEditorMode = (filename) => {
        if (!filename) return { name: 'javascript', json: true };
        
        const extension = filename.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'html':
                return 'htmlmixed';
            case 'css':
                return 'css';
            case 'md':
                return 'markdown';
            case 'json':
                return { name: 'javascript', json: true };
            case 'js':
            default:
                return { name: 'javascript', json: true };
        }
    };
    
    // Initialize CodeMirror
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: getEditorMode(activeFile?.name),
                    theme: 'base16-light', 
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                
                if (origin !== 'setValue' && activeFile) {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        fileId: activeFile.id,
                        code,
                    });
                }
            });
        }
        init();
        
        return () => {
            if (editorRef.current) {
                editorRef.current.toTextArea();
            }
        };
    }, []);
    
    // Update editor content when active file changes
    useEffect(() => {
        if (editorRef.current && activeFile) {
            // Change the editor mode based on file type
            editorRef.current.setOption('mode', getEditorMode(activeFile.name));
            
            // Set the editor content to the active file's content
            editorRef.current.setValue(activeFile.content || '');
        }
    }, [activeFile]);

    // Listen for code changes from other users
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ fileId, code }) => {
                if (code !== null && activeFile && fileId === activeFile.id) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current?.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current, activeFile]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;

import React, { useEffect, useRef } from 'react';
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

const Editor = ({ socketRef, roomId, onCodeChange, file, socketConnected }) => {
    const editorRef = useRef(null);
    const activeFileIdRef = useRef(null);

    useEffect(() => {
        async function init() {
            if (!editorRef.current) {
                editorRef.current = Codemirror.fromTextArea(
                    document.getElementById('realtimeEditor'),
                    {
                        mode: getCodeMirrorMode(file.language),
                        theme: 'dracula',
                        autoCloseTags: true,
                        autoCloseBrackets: true,
                        lineNumbers: true,
                    }
                );

                // Set initial content
                editorRef.current.setValue(file.content || '');
                activeFileIdRef.current = file.id;

                editorRef.current.on('change', (instance, changes) => {
                    const { origin } = changes;
                    const code = instance.getValue();
                    onCodeChange(code);
                    
                    // Only emit changes if they're from user input and socket is connected
                    if (origin !== 'setValue' && socketRef.current && socketConnected) {
                        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                            roomId,
                            fileId: activeFileIdRef.current,
                            code,
                        });
                    }
                });
            }
        }
        init();

        return () => {
            if (editorRef.current) {
                editorRef.current.toTextArea();
                editorRef.current = null;
            }
        };
    }, []);

    // Listen for external code changes
    useEffect(() => {
        if (!socketRef.current) return;
        
        const handleCodeChange = ({ fileId, code }) => {
            // Only update if this change is for the currently displayed file
            if (fileId === activeFileIdRef.current && editorRef.current) {
                editorRef.current.setValue(code);
            }
        };
        
        socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
        
        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        };
    }, [socketRef.current]);

    // Handle file switching
    useEffect(() => {
        if (!editorRef.current) return;
        
        // Update the active file reference
        activeFileIdRef.current = file.id;
        
        // Update editor content and mode
        editorRef.current.setValue(file.content || '');
        editorRef.current.setOption('mode', getCodeMirrorMode(file.language));
        
        // Request latest code from server
        if (socketRef.current && socketConnected) {
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
                roomId,
                fileId: file.id,
                socketId: socketRef.current.id,
            });
        }
    }, [file.id, file.language]);

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

    return (
        <div className="editorContainer">
            <textarea id="realtimeEditor"></textarea>
        </div>
    );
};

export default Editor;
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

const Editor = ({ socketRef, roomId, onCodeChange, file }) => {
    const editorRef = useRef(null);
    const codeEditorRef = useRef(null);

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

                editorRef.current.on('change', (instance, changes) => {
                    const { origin } = changes;
                    const code = instance.getValue();
                    onCodeChange(code);
                    if (origin !== 'setValue') {
                        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                            roomId,
                            fileId: file.id,
                            code,
                        });
                    }
                });

                codeEditorRef.current = {
                    fileId: file.id,
                    instance: editorRef.current
                };
            }
        }
        init();

        return () => {
            if (editorRef.current) {
                editorRef.current.toTextArea();
                editorRef.current = null;
            }
            codeEditorRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ fileId, code }) => {
                if (fileId === file.id && editorRef.current) {
                    // Only update if this change is for the current active file
                    editorRef.current.setValue(code);
                }
            });

            return () => {
                socketRef.current.off(ACTIONS.CODE_CHANGE);
            };
        }
    }, [socketRef.current, file.id]);

    useEffect(() => {
        // Handle file switching - update editor content and mode when file changes
        if (editorRef.current) {
            // If we have a new file or a different file than before
            if (!codeEditorRef.current || codeEditorRef.current.fileId !== file.id) {
                // Set new file content
                editorRef.current.setValue(file.content || '');
                // Update mode based on file language
                editorRef.current.setOption('mode', getCodeMirrorMode(file.language));
                
                // Request code from server in case it's not up to date
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    roomId,
                    fileId: file.id,
                    socketId: socketRef.current.id,
                });

                // Update reference to track current file
                if (codeEditorRef.current) {
                    codeEditorRef.current.fileId = file.id;
                } else {
                    codeEditorRef.current = { fileId: file.id, instance: editorRef.current };
                }
            }
        }
    }, [file.id, file.language]);

    // Helper function to get the appropriate CodeMirror mode based on file language
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

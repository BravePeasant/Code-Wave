const ACTIONS = {
    // Existing actions
    JOIN: 'join',
    JOINED: 'joined',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    SYNC_CODE: 'sync-code',
    LEAVE: 'leave',
    
    // New file management actions
    CREATE_FILE: 'create-file',
    FILE_CREATED: 'file-created',
    DELETE_FILE: 'delete-file',
    FILE_DELETED: 'file-deleted',
    RENAME_FILE: 'rename-file',
    FILE_RENAMED: 'file-renamed',
    SWITCH_FILE: 'switch-file',
    FILE_SWITCHED: 'file-switched',
    SYNC_FILES: 'sync-files',
    FILES_SYNCED: 'files-synced'
};

module.exports = ACTIONS;

// FileUtils.js - Utility functions for file operations
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Download a single file to the user's device
 * @param {Object} file - File object with name and content
 */
export const downloadFile = (file) => {
  if (!file || !file.name || file.content === undefined) {
    console.error('Invalid file data');
    return;
  }
  
  // Create a blob with the file content
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  
  // Use FileSaver to save the file
  saveAs(blob, file.name);
};

/**
 * Download all files as a zip archive
 * @param {Array} files - Array of file objects
 * @param {String} roomId - Room ID to use as the zip filename
 */
export const downloadAllFiles = async (files, roomId) => {
  if (!files || !files.length) {
    console.error('No files to download');
    return;
  }
  
  try {
    const zip = new JSZip();
    
    // Add each file to the zip
    files.forEach(file => {
      zip.file(file.name, file.content || '');
    });
    
    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: 'blob' });
    
    // Download the zip file
    saveAs(zipContent, `${roomId || 'code-wave'}-files.zip`);
  } catch (error) {
    console.error('Error creating zip file:', error);
  }
};

/**
 * Save all files to local storage
 * @param {Array} files - Array of file objects
 * @param {String} roomId - Room ID to use as the storage key
 */
export const saveToLocalStorage = (files, roomId) => {
  if (!files || !roomId) return;
  
  try {
    localStorage.setItem(`codewave-${roomId}`, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving to local storage:', error);
  }
};

/**
 * Load files from local storage
 * @param {String} roomId - Room ID to load files for
 * @returns {Array|null} Array of file objects or null if not found
 */
export const loadFromLocalStorage = (roomId) => {
  if (!roomId) return null;
  
  try {
    const savedFiles = localStorage.getItem(`codewave-${roomId}`);
    return savedFiles ? JSON.parse(savedFiles) : null;
  } catch (error) {
    console.error('Error loading from local storage:', error);
    return null;
  }
};

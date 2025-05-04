# CodeWave: Real-time Collaborative Code Editor

<div align="center">
  <img src="/code-wave.png" alt="CodeWave Logo" width="200"/>
  <br>
  <p><strong>Collaborate on code in real-time with multiple files support</strong></p>
</div>

![GitHub](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-17.0.2-61DAFB)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.4.1-010101)
![CodeMirror](https://img.shields.io/badge/CodeMirror-5.65.2-D30707)

## ✨ Features

- **Real-time Collaboration**: Multiple users can edit the same codebase simultaneously
- **Multi-File Support**: Create, edit, rename, and delete multiple files within a workspace
- **Language Support**: JavaScript, HTML, CSS, TypeScript, Python, Java, and Markdown
- **Room-Based Collaboration**: Create or join rooms with unique IDs for team collaboration
- **File Management**:
  - Create new files with different language types
  - Rename and delete files
  - Download individual files or all files as a ZIP archive
  - Save files to browser storage for persistence
- **User Presence**: See who's currently in your room with user avatars
- **Modern UI**: Clean, intuitive interface with dark theme code editor
- **Responsive Design**: Works across desktop and tablet devices

## 🚀 Tech Stack

### Frontend
- **React** - UI library
- **CodeMirror** - Code editing component
- **Socket.IO Client** - Real-time communication
- **React Router** - Navigation and routing
- **React Avatar** - User avatars
- **React Hot Toast** - Notifications
- **JSZip & FileSaver** - File download functionality
- **UUID** - Generate unique IDs

### Backend
- **Node.js & Express** - Server runtime and framework
- **Socket.IO** - Real-time bidirectional event-based communication
- **Cors** - Cross-origin resource sharing

## 🔧 How It Works

### Real-time Collaboration
CodeWave uses Socket.IO to establish WebSocket connections between clients and the server. When users make changes to a file, those changes are broadcast to all other users in the same room, providing a seamless collaborative experience.

### File Synchronization
The application maintains a synchronized state of all files across all connected clients. When a new user joins a room, they receive the current state of all files, ensuring everyone is working with the same codebase.

### Code Editor
CodeWave leverages CodeMirror for its powerful code editing capabilities, including:
- Syntax highlighting for multiple languages
- Line numbers
- Auto-closing brackets and tags
- Custom theme (Dracula)

## 🔍 Project Structure

- **Client-side**:
  - React components for UI elements
  - Socket.IO client for real-time communication
  - File utility functions for downloading and local storage

- **Server-side**:
  - Express server
  - Socket.IO server for handling real-time events
  - In-memory data storage for rooms and files

## 🛠️ Installation & Usage

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codewave
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   # Start frontend only
   npm run start:front
   
   # Start backend server in development mode
   npm run server:dev
   
   # Build and start production server
   npm start
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Create a new room or join an existing one with a Room ID
   - Start coding collaboratively!

## 🔐 Environment Variables

The application can be configured with the following environment variables:
- `PORT` - The port on which the server runs (default: 5000)

## 💡 Unique Aspects

- **Multi-File Support**: Unlike many other collaborative editors, CodeWave allows for multiple files with different language types within the same collaborative session.

- **Browser Storage Integration**: Users can save their work to browser storage for easy recovery if disconnected.

- **Room-Based Architecture**: The room-based system allows for isolated collaboration spaces, perfect for different teams or projects.

- **Efficient Sync Mechanism**: CodeWave uses an efficient synchronization mechanism that only transmits code changes rather than entire files.

- **Reconnection Handling**: The application includes reconnection functionality to handle temporary network disruptions.

## 👥 Contributors

Made by Shaikh Faiz Faheem Ahmad and Pratik Ajay Gawad

## 📄 License

This project is licensed under the MIT License.

# Virtual Office

A browser-based 3D multiplayer office where each player gets a randomly generated room built with Three.js. Players can chat with each other in real-time via WebSockets, with messages appearing as floating 3D text above avatars.

## Features
- Procedurally generated 3D office room (seeded, saved to localStorage)
- Real-time multiplayer via WebSockets
- Floating 3D chat bubbles above player avatars
- Persistent room seed and username via localStorage

## Stack
- **Frontend**: Three.js + Vite
- **Backend**: Node.js + `ws` WebSocket server

## Getting Started

### Server
```bash
cd server
npm install
node index.js
```

### Client
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

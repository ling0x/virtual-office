const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  if (req.url === '/players') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    const playerList = Array.from(players.values()).map(p => ({
      id: p.id,
      name: p.name,
      roomSeed: p.roomSeed
    }));
    res.end(JSON.stringify(playerList));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

// players: Map<ws, { id, name, roomSeed, position, rotation }>
const players = new Map();

function broadcast(data, excludeWs = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function sendTo(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

wss.on('connection', (ws) => {
  console.log('New connection');

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'join': {
        const player = {
          id: msg.id,
          name: msg.name || 'Anonymous',
          roomSeed: msg.roomSeed,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0
        };
        players.set(ws, player);

        // Send current players to the new joiner
        const existing = Array.from(players.entries())
          .filter(([k]) => k !== ws)
          .map(([, p]) => p);
        sendTo(ws, { type: 'init', players: existing });

        // Notify others
        broadcast({ type: 'playerJoined', player }, ws);
        console.log(`${player.name} joined (seed: ${player.roomSeed})`);
        break;
      }

      case 'move': {
        const player = players.get(ws);
        if (!player) break;
        player.position = msg.position;
        player.rotation = msg.rotation;
        broadcast({ type: 'playerMoved', id: player.id, position: msg.position, rotation: msg.rotation }, ws);
        break;
      }

      case 'chat': {
        const player = players.get(ws);
        if (!player) break;
        const payload = {
          type: 'chat',
          id: player.id,
          name: player.name,
          message: msg.message,
          timestamp: Date.now()
        };
        broadcast(payload); // send to everyone including sender
        console.log(`[${player.name}]: ${msg.message}`);
        break;
      }
    }
  });

  ws.on('close', () => {
    const player = players.get(ws);
    if (player) {
      broadcast({ type: 'playerLeft', id: player.id }, ws);
      console.log(`${player.name} disconnected`);
      players.delete(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Virtual Office server running on ws://localhost:${PORT}`);
});

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

let ws = null;
const handlers = {};

export function connect(onMessage) {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected');
    if (handlers.open) handlers.open();
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      onMessage(msg);
    } catch {}
  };

  ws.onclose = () => {
    console.log('WebSocket closed, reconnecting in 3s...');
    setTimeout(() => connect(onMessage), 3000);
  };

  ws.onerror = (err) => console.error('WS error', err);
}

export function onOpen(fn) { handlers.open = fn; }

export function send(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function sendJoin(id, name, roomSeed) {
  send({ type: 'join', id, name, roomSeed });
}

export function sendMove(position, rotation) {
  send({ type: 'move', position, rotation });
}

export function sendChat(message) {
  send({ type: 'chat', message });
}

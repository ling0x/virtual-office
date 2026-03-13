const KEYS = {
  roomSeed: 'vo_room_seed',
  playerName: 'vo_player_name',
  playerId: 'vo_player_id',
  chatHistory: 'vo_chat_history'
};

export function getRoomSeed() {
  let seed = localStorage.getItem(KEYS.roomSeed);
  if (!seed) {
    seed = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(KEYS.roomSeed, seed);
  }
  return seed;
}

export function getPlayerId() {
  let id = localStorage.getItem(KEYS.playerId);
  if (!id) {
    id = 'player_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(KEYS.playerId, id);
  }
  return id;
}

export function getPlayerName() {
  return localStorage.getItem(KEYS.playerName) || '';
}

export function setPlayerName(name) {
  localStorage.setItem(KEYS.playerName, name);
}

export function getChatHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.chatHistory)) || [];
  } catch {
    return [];
  }
}

export function saveChatMessage(msg) {
  const history = getChatHistory();
  history.push(msg);
  if (history.length > 100) history.splice(0, history.length - 100);
  localStorage.setItem(KEYS.chatHistory, JSON.stringify(history));
}

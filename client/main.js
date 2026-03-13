import * as THREE from 'three';
import { getRoomSeed, getPlayerId, getPlayerName, setPlayerName } from './storage.js';
import { buildRoom } from './room.js';
import { createLocalPlayer, createRemoteAvatar, updateLocalPlayer } from './player.js';
import { initChat, addChatLine, showBubble, updateBubblePosition } from './chat.js';
import { connect, onOpen, sendJoin, sendMove, sendChat } from './socket.js';

// ── DOM ─────────────────────────────────────────────────────────────────
const nameModal = document.getElementById('name-modal');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const hudName = document.getElementById('hud-name');
const hudSeed = document.getElementById('hud-seed');
const playersList = document.getElementById('players-list');

// ── State ────────────────────────────────────────────────────────────────
const playerId = getPlayerId();
const roomSeed = getRoomSeed();
let playerName = getPlayerName();
const remotePlayers = new Map(); // id -> { avatar, name }

// ── Three.js setup ───────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14);
scene.fog = new THREE.Fog(0x0a0a14, 10, 30);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.65, 3);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(3, 8, 5);
dirLight.castShadow = true;
scene.add(dirLight);
const pointLight = new THREE.PointLight(0xfff5c0, 0.6, 12);
pointLight.position.set(0, 3.0, 0);
scene.add(pointLight);

// Build room
const { deskX, deskZ, accentColor } = buildRoom(scene, roomSeed);

// Local player
const localPlayer = createLocalPlayer(scene, accentColor);

// Mouse look
let yaw = 0;
renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === renderer.domElement) {
    yaw -= e.movementX * 0.002;
    camera.rotation.set(0, yaw, 0);
  }
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── HUD ──────────────────────────────────────────────────────────────────
function updateHUD() {
  hudName.textContent = `You: ${playerName}`;
  hudSeed.textContent = `Room: ${roomSeed}`;
}

function updatePlayersList() {
  const names = Array.from(remotePlayers.values()).map(p => `<div>${p.name}</div>`).join('');
  playersList.innerHTML = names || '<div style="opacity:0.5">Just you</div>';
}

// ── WebSocket message handler ────────────────────────────────────────────
function handleMessage(msg) {
  switch (msg.type) {
    case 'init': {
      msg.players.forEach(p => addRemotePlayer(p));
      break;
    }
    case 'playerJoined': {
      addRemotePlayer(msg.player);
      addChatLine('System', `${msg.player.name} joined`);
      break;
    }
    case 'playerLeft': {
      removeRemotePlayer(msg.id);
      break;
    }
    case 'playerMoved': {
      const rp = remotePlayers.get(msg.id);
      if (rp) {
        rp.avatar.position.set(msg.position.x, msg.position.y, msg.position.z);
        rp.avatar.rotation.y = msg.rotation;
        updateBubblePosition(msg.id, rp.avatar);
      }
      break;
    }
    case 'chat': {
      addChatLine(msg.name, msg.message, msg.id === playerId);
      const rp = remotePlayers.get(msg.id);
      if (rp) showBubble(scene, msg.id, rp.avatar, msg.message);
      // Show local bubble above camera position
      if (msg.id === playerId) {
        const fakeGroup = { position: { x: localPlayer.position.x, y: 0, z: localPlayer.position.z } };
        showBubble(scene, playerId + '_local', fakeGroup, msg.message);
      }
      break;
    }
  }
}

function addRemotePlayer(p) {
  if (remotePlayers.has(p.id)) return;
  const colors = [0x818cf8, 0x34d399, 0xfbbf24, 0xf87171, 0x22d3ee];
  const color = colors[Math.abs(hashCode(p.id)) % colors.length];
  const avatar = createRemoteAvatar(scene, p.id, color);
  if (p.position) avatar.position.set(p.position.x, p.position.y, p.position.z);
  remotePlayers.set(p.id, { avatar, name: p.name });
  updatePlayersList();
}

function removeRemotePlayer(id) {
  const rp = remotePlayers.get(id);
  if (rp) {
    scene.remove(rp.avatar);
    remotePlayers.delete(id);
    updatePlayersList();
    addChatLine('System', `${rp.name} left`);
  }
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

// ── Chat init ────────────────────────────────────────────────────────────
initChat(scene, (text) => {
  sendChat(text);
});

// ── Name modal ───────────────────────────────────────────────────────────
function startSession() {
  updateHUD();
  nameModal.classList.add('hidden');

  connect(handleMessage);
  onOpen(() => {
    sendJoin(playerId, playerName, roomSeed);
  });

  // Throttled position broadcast
  let lastPos = null;
  setInterval(() => {
    const pos = localPlayer.position;
    const posObj = { x: +pos.x.toFixed(3), y: 0, z: +pos.z.toFixed(3) };
    if (!lastPos || posObj.x !== lastPos.x || posObj.z !== lastPos.z) {
      sendMove(posObj, +yaw.toFixed(3));
      lastPos = { ...posObj };
    }
  }, 100);
}

if (playerName) {
  startSession();
} else {
  nameInput.value = '';
  nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = nameInput.value.trim();
    if (!val) return;
    playerName = val;
    setPlayerName(val);
    startSession();
  });
}

// ── Render loop ──────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  updateLocalPlayer(localPlayer, camera);
  renderer.render(scene, camera);
}
animate();

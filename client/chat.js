import * as THREE from 'three';
import { saveChatMessage } from './storage.js';

const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

const BUBBLE_DURATION = 5000; // ms

// Map of playerId -> { sprite, timeoutId }
const bubbles = new Map();

export function initChat(scene, onSend) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    onSend(text);
  });

  // Prevent movement keys from firing while typing
  chatInput.addEventListener('keydown', e => e.stopPropagation());
}

export function addChatLine(name, message, isLocal = false) {
  const line = document.createElement('div');
  line.className = 'chat-line';
  line.innerHTML = `<span class="author">${escapeHtml(name)}</span>: ${escapeHtml(message)}`;
  chatLog.prepend(line);

  // Keep max 60 lines
  while (chatLog.children.length > 60) chatLog.removeChild(chatLog.lastChild);

  saveChatMessage({ name, message, timestamp: Date.now() });
}

export function showBubble(scene, playerId, avatarGroup, text) {
  // Remove old bubble
  if (bubbles.has(playerId)) {
    const old = bubbles.get(playerId);
    clearTimeout(old.timeoutId);
    scene.remove(old.sprite);
    old.sprite.material.map.dispose();
    old.sprite.material.dispose();
    bubbles.delete(playerId);
  }

  const sprite = makeTextSprite(text);
  sprite.position.set(
    avatarGroup.position.x,
    1.8,
    avatarGroup.position.z
  );
  scene.add(sprite);

  const timeoutId = setTimeout(() => {
    scene.remove(sprite);
    sprite.material.map.dispose();
    sprite.material.dispose();
    bubbles.delete(playerId);
  }, BUBBLE_DURATION);

  bubbles.set(playerId, { sprite, timeoutId });
  return sprite;
}

export function updateBubblePosition(playerId, avatarGroup) {
  const bubble = bubbles.get(playerId);
  if (bubble) {
    bubble.sprite.position.set(
      avatarGroup.position.x,
      1.8,
      avatarGroup.position.z
    );
  }
}

function makeTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  roundRect(ctx, 8, 8, 496, 112, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Truncate long messages
  const displayText = text.length > 40 ? text.slice(0, 37) + '...' : text;
  ctx.fillText(displayText, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.2, 0.55, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

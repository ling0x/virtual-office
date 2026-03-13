import * as THREE from 'three';

const SPEED = 0.06;
const ROOM_BOUND = 5.2;

const keys = {};
window.addEventListener('keydown', e => (keys[e.key] = true));
window.addEventListener('keyup', e => (keys[e.key] = false));

export function createLocalPlayer(scene, accentColor) {
  // Invisible local player body (camera IS the player)
  const group = new THREE.Group();
  group.position.set(0, 0, 3);
  scene.add(group);
  return group;
}

export function createRemoteAvatar(scene, id, color = 0x818cf8) {
  const group = new THREE.Group();

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.9, 0.3),
    new THREE.MeshLambertMaterial({ color })
  );
  body.position.y = 0.45;
  group.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.38, 0.38),
    new THREE.MeshLambertMaterial({ color: 0xffd6a5 })
  );
  head.position.y = 1.1;
  group.add(head);

  scene.add(group);
  return group;
}

export function updateLocalPlayer(playerGroup, camera) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys['w'] || keys['W'] || keys['ArrowUp']) playerGroup.position.addScaledVector(forward, SPEED);
  if (keys['s'] || keys['S'] || keys['ArrowDown']) playerGroup.position.addScaledVector(forward, -SPEED);
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) playerGroup.position.addScaledVector(right, -SPEED);
  if (keys['d'] || keys['D'] || keys['ArrowRight']) playerGroup.position.addScaledVector(right, SPEED);

  playerGroup.position.x = Math.max(-ROOM_BOUND, Math.min(ROOM_BOUND, playerGroup.position.x));
  playerGroup.position.z = Math.max(-ROOM_BOUND, Math.min(ROOM_BOUND, playerGroup.position.z));

  camera.position.set(
    playerGroup.position.x,
    1.65,
    playerGroup.position.z
  );
}

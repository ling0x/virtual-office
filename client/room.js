import * as THREE from 'three';
import seedrandom from 'seedrandom';

const ROOM_W = 12;
const ROOM_H = 3.5;
const ROOM_D = 12;

const WALL_COLORS = [0x2d2d44, 0x1e3a4a, 0x2e1e3a, 0x1a3a2e, 0x3a2e1e];
const FLOOR_COLORS = [0x8b7355, 0x6b5b45, 0x7a6a5a, 0x5a4a3a, 0x9a8a7a];
const ACCENT_COLORS = [0x4f46e5, 0x10b981, 0xf59e0b, 0xef4444, 0x06b6d4];

export function buildRoom(scene, seed) {
  const rng = seedrandom(seed);
  const rand = () => rng();

  const wallColor = WALL_COLORS[Math.floor(rand() * WALL_COLORS.length)];
  const floorColor = FLOOR_COLORS[Math.floor(rand() * FLOOR_COLORS.length)];
  const accentColor = ACCENT_COLORS[Math.floor(rand() * ACCENT_COLORS.length)];

  const wallMat = new THREE.MeshLambertMaterial({ color: wallColor });
  const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
  const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.1, ROOM_D), floorMat);
  floor.position.y = -0.05;
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.1, ROOM_D), ceilingMat);
  ceiling.position.y = ROOM_H;
  scene.add(ceiling);

  // Walls
  const wallThick = 0.15;
  const wallDefs = [
    { size: [ROOM_W, ROOM_H, wallThick], pos: [0, ROOM_H / 2, -ROOM_D / 2] }, // back
    { size: [ROOM_W, ROOM_H, wallThick], pos: [0, ROOM_H / 2, ROOM_D / 2] },  // front
    { size: [wallThick, ROOM_H, ROOM_D], pos: [-ROOM_W / 2, ROOM_H / 2, 0] }, // left
    { size: [wallThick, ROOM_H, ROOM_D], pos: [ROOM_W / 2, ROOM_H / 2, 0] },  // right
  ];
  wallDefs.forEach(({ size, pos }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat);
    mesh.position.set(...pos);
    mesh.receiveShadow = true;
    scene.add(mesh);
  });

  // Window (accent coloured frame on back wall)
  const winFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.6, 0.08),
    new THREE.MeshLambertMaterial({ color: accentColor })
  );
  winFrame.position.set(rand() * 4 - 2, 1.8, -ROOM_D / 2 + 0.1);
  scene.add(winFrame);

  const winGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 1.2, 0.02),
    new THREE.MeshLambertMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.35 })
  );
  winGlass.position.copy(winFrame.position);
  winGlass.position.z += 0.05;
  scene.add(winGlass);

  // Desk
  const deskColor = 0xc8a97a;
  const deskX = (rand() - 0.5) * 6;
  const deskZ = (rand() - 0.5) * 6;
  const deskMat = new THREE.MeshLambertMaterial({ color: deskColor });
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), deskMat);
  deskTop.position.set(deskX, 0.76, deskZ);
  deskTop.castShadow = true;
  scene.add(deskTop);
  // Desk legs
  const legGeo = new THREE.BoxGeometry(0.08, 0.72, 0.08);
  [[-1, -0.4], [-1, 0.4], [1, -0.4], [1, 0.4]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, deskMat);
    leg.position.set(deskX + lx, 0.36, deskZ + lz);
    scene.add(leg);
  });

  // Monitor
  const monitorMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const screenMat = new THREE.MeshLambertMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.4 });
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.06), monitorMat);
  monitor.position.set(deskX, 1.22, deskZ - 0.3);
  scene.add(monitor);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.54, 0.01), screenMat);
  screen.position.copy(monitor.position);
  screen.position.z -= 0.04;
  scene.add(screen);

  // Chair
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x333344 });
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.7), chairMat);
  chairSeat.position.set(deskX, 0.5, deskZ + 0.8);
  scene.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.08), chairMat);
  chairBack.position.set(deskX, 0.85, deskZ + 1.1);
  scene.add(chairBack);

  // Optional: bookshelf
  if (rand() > 0.4) {
    const shelfMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    const shelfX = (rand() > 0.5 ? 1 : -1) * (ROOM_W / 2 - 0.4);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.0, 1.4), shelfMat);
    shelf.position.set(shelfX, 1.0, (rand() - 0.5) * 4);
    scene.add(shelf);
    // Books
    const bookColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6];
    for (let i = 0; i < 5; i++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.28 + rand() * 0.2, 0.18),
        new THREE.MeshLambertMaterial({ color: bookColors[i] })
      );
      book.position.set(shelfX + (rand() * 0.1 - 0.05), 0.5 + i * 0.38, shelf.position.z + (rand() * 0.6 - 0.3));
      scene.add(book);
    }
  }

  // Optional: plant
  if (rand() > 0.5) {
    const potMat = new THREE.MeshLambertMaterial({ color: 0xc47c3c });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.22, 8), potMat);
    const px = (rand() - 0.5) * 8;
    const pz = (rand() - 0.5) * 8;
    pot.position.set(px, 0.11, pz);
    scene.add(pot);
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 7, 7),
      new THREE.MeshLambertMaterial({ color: 0x228b22 })
    );
    foliage.position.set(px, 0.52, pz);
    scene.add(foliage);
  }

  return { deskX, deskZ, accentColor };
}

import * as THREE from 'three/webgpu';
import { NPCManager } from './entities/NPCManager';

// --- GAME STATE ---
const STATE = {
  gold: 50,
  activeSlot: 0,
  inventory: [
    { type: 'carrot', qty: 5, price: 10, growTime: 5 },
    { type: 'flower', qty: 5, price: 25, growTime: 10 },
    { type: 'water', qty: 10, maxQty: 10, price: 0, growTime: 0 },
    { type: 'harvest', qty: Infinity, price: 0, growTime: 0 }
  ],
  day: 1,
  gameTime: 8 * 60,
  timeScale: 0.1,
  tileSize: 1.5,
  gridUnits: 16,
  cameraZoom: 1.0
};
const APP_VERSION = '0.1.0';

// Crop tracking: key = "x,z"
const cropGrid = new Map<string, any>();
let playerMeshRef: THREE.Group | null = null;
const cameraPan = new THREE.Vector3(0, 0, 0);
const worldBounds = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };
const edgeBlockers: Array<{ x: number; z: number; radius: number }> = [];

// Sound System (Web Audio API synthesis)
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
function playSound(type: 'click' | 'rustle' | 'splash' | 'success' | 'refill' | 'error') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'splash') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'rustle') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'refill') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
  } else if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
  }
}

// Toast System
function showToast(message: string, type: 'success' | 'warning' | 'info' = 'info') {
  if (type === 'success') playSound('success');
  if (type === 'warning') playSound('error');
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Shop System
let shopOpen = false;
function toggleShop(playerPos?: THREE.Vector3) {
  if (!shopOpen && playerPos) {
    // Check distance to Market Stall at (3, 0, -6)
    const stallPos = new THREE.Vector3(3, 0, -6);
    if (playerPos.distanceTo(stallPos) > 4) {
      showToast("Must be near the Market Stall to trade!", "warning");
      return;
    }
  }

  shopOpen = !shopOpen;
  const modal = document.getElementById('shop-modal');
  if (shopOpen) {
    modal?.classList.remove('hidden');
    document.querySelector('.wallet-panel')?.classList.add('bump');
  } else {
    modal?.classList.add('hidden');
    document.querySelector('.wallet-panel')?.classList.remove('bump');
  }
}

// Inputs
const keys = {
  w: false, a: false, s: false, d: false, space: false, shift: false,
  arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
};
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('mousedown', () => {
  if (shopOpen) return;
  // Interaction triggered by click
  handleMouseInteraction();
});

function handleMouseInteraction() {
  // We'll reuse the grid coordinates updated in the render loop
  if (lastGridX !== null && lastGridZ !== null) {
     handleInteraction(lastGridX, lastGridZ, globalScene);
  }
}

let lastGridX: number | null = null;
let lastGridZ: number | null = null;
let globalScene: THREE.Scene;
window.addEventListener('keydown', e => {
  if (e.key === ' ') keys.space = true;
  if (e.key === 'Shift') keys.shift = true;
  const k = e.key.toLowerCase();
  if (k in keys) (keys as any)[k] = true;
});
window.addEventListener('keyup', e => {
  if (e.key === ' ') keys.space = false;
  if (e.key === 'Shift') keys.shift = false;
  const k = e.key.toLowerCase();
  if (k in keys) (keys as any)[k] = false;
  if (e.key === '1') selectSlot(0);
  if (e.key === '2') selectSlot(1);
  if (e.key === '3') selectSlot(2);
  if (e.key === '4') selectSlot(3);
  
  if (e.key === 'b') toggleShop(playerMeshRef?.position);
  if (e.key === 'Escape' && shopOpen) toggleShop();
});

// Scroll to cycle hotbar
window.addEventListener('wheel', e => {
  if (shopOpen) return;
  let newSlot = STATE.activeSlot + (e.deltaY > 0 ? 1 : -1);
  if (newSlot < 0) newSlot = 3;
  if (newSlot > 3) newSlot = 0;
  selectSlot(newSlot);
});

// Zoom support
window.addEventListener('wheel', e => {
  if (!shopOpen && !e.ctrlKey) {
     // If not ctrl key, we use wheel for hotbar? 
     // Usually wheel is for zoom in games. Let's swap them.
     // Shift+Wheel for zoom? No, standard is Wheel for zoom.
     // Let's use Wheel for zoom, and maybe numbers only for slots?
     // Actually, let's stick to user-friendly: Wheel = Zoom, 1-4 = Slots.
     // Or Wheel = Slots, Alt+Wheel = Zoom.
     // Actually, most casual sims use Wheel for Hotbar. 
     // Let's use e.shiftKey + Wheel for Zoom.
  }
}, { passive: false });

// Let's refine the wheel logic:
window.addEventListener('wheel', e => {
  if (shopOpen) return;
  if (e.shiftKey) {
    STATE.cameraZoom = Math.max(0.5, Math.min(2.0, STATE.cameraZoom + (e.deltaY * 0.001)));
  } else {
    let newSlot = STATE.activeSlot + (e.deltaY > 0 ? 1 : -1);
    if (newSlot < 0) newSlot = 3;
    if (newSlot > 3) newSlot = 0;
    selectSlot(newSlot);
  }
});

// UI Handlers
function selectSlot(index: number) {
  STATE.activeSlot = index;
  playSound('click');
  document.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
}
document.querySelectorAll('.slot').forEach((el, i) => {
  el.addEventListener('click', () => selectSlot(i));
});

// Changelog Modal System
let changelogShown = false;
function showChangelogModal() {
  if (changelogShown) return;
  changelogShown = true;

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:999;display:flex;place-items:center;";

  const modal = document.createElement("div");
  modal.style.cssText = "background:rgba(15,20,15,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:2.5rem;width:90%;max-width:600px;transform:translateY(0);transition:transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275);";

  const header = document.createElement("div");
  header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:1rem;";

  const title = document.createElement("h2");
  title.textContent = "Update Log";
  title.style.cssText = "margin:0;color:#ffeb3b;font-size:2rem;";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = "background:none;border:none;color:white;font-size:1.5rem;cursor:pointer;opacity:0.6;transition:opacity 0.2s;";
  closeBtn.addEventListener("mouseover", () => closeBtn.style.opacity = "1");
  closeBtn.addEventListener("mouseout", () => closeBtn.style.opacity = "0.6");
  closeBtn.addEventListener("click", () => { overlay.style.opacity = "0"; setTimeout(() => overlay.remove(), 300); });

  header.appendChild(title);
  header.appendChild(closeBtn);

  const content = document.createElement("div");
  content.innerHTML = `<div style="color:rgba(255,255,255,0.82);font-size:1.02rem;line-height:1.8;margin-bottom:1.5rem;">
    <h3 style="color:#a8ff78;margin:1.2rem 0 0.5rem 0;">v${APP_VERSION} - Movement + World Polish</h3>
    <ul style="list-style:none;padding:0;margin:0;">
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Movement reliability improved and player stays in playable bounds</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Camera panning added with arrow keys while still following player</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Outer world edges upgraded with perimeter detail and soft blockers</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Documentation and update log synced with current build</li>
    </ul>
    <div style="margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.92rem;">
      Controls: WASD move, Shift sprint, Arrow keys pan camera, Shift + Wheel zoom, 1-4 tools, Space interact, B shop.
    </div>
  </div>`;

  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    modal.style.transform = "translateY(0)";
    overlay.style.opacity = "1";
  });
}

// Shop Binding
document.getElementById('close-shop')?.addEventListener('click', () => toggleShop());
document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const type = target.dataset.type;
    const price = parseInt(target.dataset.price || '0');
    
    if (STATE.gold >= price) {
      STATE.gold -= price;
      const invIdx = STATE.inventory.findIndex(i => i.type === type);
      if (invIdx !== -1) STATE.inventory[invIdx].qty += 1;
      showToast(`Bought 1 ${type} seed`, 'success');
      playSound('success');
      document.querySelector('.wallet-panel')?.classList.add('bump');
      setTimeout(() => document.querySelector('.wallet-panel')?.classList.remove('bump'), 200);
    } else {
      showToast(`Not enough gold!`, 'warning');
    }
  });
});

// Time Skip Binding
document.getElementById('ff-btn')?.addEventListener('click', () => {
  if (!shopOpen) {
    STATE.gameTime = 6 * 60; // Skip to 6 AM
    STATE.day += 1;
    cropGrid.forEach(c => c.isWatered = false);
    showToast(`Good morning! Day ${STATE.day} has begun.`, 'info');
    playSound('refill');
  }
});

function updateUI() {
  document.getElementById('gold-display')!.innerText = STATE.gold.toString();
  document.getElementById('qty-carrot')!.innerText = STATE.inventory[0].qty.toString();
  document.getElementById('qty-flower')!.innerText = STATE.inventory[1].qty.toString();
  document.getElementById('qty-water')!.innerText = STATE.inventory[2].qty.toString();
  
  const hours = Math.floor(STATE.gameTime / 60) % 24;
  const mins = Math.floor(STATE.gameTime % 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hDisplay = (hours % 12 || 12).toString().padStart(2, '0');
  const mDisplay = mins.toString().padStart(2, '0');
  
  document.getElementById('time-display')!.innerText = `${hDisplay}:${mDisplay} ${ampm}`;
  document.getElementById('day-display')!.innerText = `Day ${STATE.day}`;
}

async function init() {
  const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
  const renderer = new THREE.WebGPURenderer({ 
    canvas, 
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Transparent for CSS bg
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  await renderer.init();
  
  const scene = new THREE.Scene();
  globalScene = scene;
  
  // Dynamic camera follows player
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
  sunLight.position.set(10, 20, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.left = -15;
  sunLight.shadow.camera.right = 15;
  sunLight.shadow.camera.top = 15;
  sunLight.shadow.camera.bottom = -15;
  scene.add(sunLight);
  
  // --- WORLD GENERATION: TOWNSHIP GRID ---
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);
  
  // Base Terrain Plane
  const mapSize = STATE.gridUnits * STATE.tileSize;
  const mapHalfSize = mapSize * 0.5;
  worldBounds.minX = -mapHalfSize + 1;
  worldBounds.maxX = mapHalfSize - 1;
  worldBounds.minZ = -mapHalfSize + 1;
  worldBounds.maxZ = mapHalfSize - 1;
  const groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardNodeMaterial({
    color: 0x335c24,
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  ground.position.y = -0.05;
  worldGroup.add(ground);
  
  // House Building (Collision Object)
  const houseGroup = new THREE.Group();
  houseGroup.position.set(-4, 0, -4);
  
  const wallGeo = new THREE.BoxGeometry(4, 3, 4);
  const wallMat = new THREE.MeshStandardNodeMaterial({ color: 0xe0e0e0, roughness: 0.8 });
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = 1.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  houseGroup.add(walls);
  
  const roofGeo = new THREE.ConeGeometry(3.5, 2, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMat = new THREE.MeshStandardNodeMaterial({ color: 0x8d3e35, roughness: 0.9 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 4;
  roof.castShadow = true;
  houseGroup.add(roof);
  
  worldGroup.add(houseGroup);
  
  // The Walkable Farm Plot Box (Visual Marker)
  const plotGeo = new THREE.BoxGeometry(STATE.tileSize * 6, 0.1, STATE.tileSize * 4);
  const plotMat = new THREE.MeshStandardNodeMaterial({ color: 0x3a2311, roughness: 1.0 });
  const plotMesh = new THREE.Mesh(plotGeo, plotMat);
  plotMesh.position.set(3, -0.02, 2);
  plotMesh.receiveShadow = true;
  worldGroup.add(plotMesh);
  
  // --- ENVIRONMENT DECORATIONS ---

  // Shared materials
  const stoneMat = new THREE.MeshStandardNodeMaterial({ color: 0x9e9e9e, roughness: 0.95 });
  const woodMat = new THREE.MeshStandardNodeMaterial({ color: 0x5d4037, roughness: 0.9 });
  const darkWoodMat = new THREE.MeshStandardNodeMaterial({ color: 0x3e2723, roughness: 1.0 });
  const leafGreenMat = new THREE.MeshStandardNodeMaterial({ color: 0x1b5e20, roughness: 0.8 });
  const lightLeafMat = new THREE.MeshStandardNodeMaterial({ color: 0x2e7d32, roughness: 0.8 });
  const waterMat = new THREE.MeshStandardNodeMaterial({ color: 0x1565c0, roughness: 0.2, metalness: 0.3 });
  const dirtPathMat = new THREE.MeshStandardNodeMaterial({ color: 0x6d4c31, roughness: 1.0 });

  // ====== DIRT PATH NETWORK ======
  // Main path from house to farm
  const pathGeo1 = new THREE.BoxGeometry(1.2, 0.02, 8);
  const path1 = new THREE.Mesh(pathGeo1, dirtPathMat);
  path1.position.set(-1, 0.0, -1);
  path1.receiveShadow = true;
  worldGroup.add(path1);

  // Branch path to town square
  const pathGeo2 = new THREE.BoxGeometry(8, 0.02, 1.2);
  const path2 = new THREE.Mesh(pathGeo2, dirtPathMat);
  path2.position.set(-1, 0.0, -5);
  path2.receiveShadow = true;
  worldGroup.add(path2);

  // Path from town to pond
  const pathGeo3 = new THREE.BoxGeometry(1.2, 0.02, 6);
  const path3 = new THREE.Mesh(pathGeo3, dirtPathMat);
  path3.position.set(-7, 0.0, -7);
  path3.receiveShadow = true;
  worldGroup.add(path3);

  // ====== CAMPFIRE (Enhanced) ======
  // Stone ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stoneGeo = new THREE.SphereGeometry(0.15, 6, 4);
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(1 + Math.cos(angle) * 0.6, 0.1, -4 + Math.sin(angle) * 0.6);
    stone.scale.y = 0.6;
    worldGroup.add(stone);
  }
  // Log seats
  const logSeatGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6);
  const logSeat1 = new THREE.Mesh(logSeatGeo, darkWoodMat);
  logSeat1.rotation.z = Math.PI / 2;
  logSeat1.position.set(2.2, 0.2, -4);
  logSeat1.castShadow = true;
  worldGroup.add(logSeat1);
  const logSeat2 = new THREE.Mesh(logSeatGeo, darkWoodMat);
  logSeat2.rotation.z = Math.PI / 2;
  logSeat2.rotation.y = Math.PI / 3;
  logSeat2.position.set(0.5, 0.2, -3.2);
  logSeat2.castShadow = true;
  worldGroup.add(logSeat2);

  // Actual fire emissive
  const fireGeo = new THREE.DodecahedronGeometry(0.3);
  const fireMat = new THREE.MeshBasicNodeMaterial({ color: 0xffa000 });
  const fireMesh = new THREE.Mesh(fireGeo, fireMat);
  fireMesh.position.set(1, 0.3, -4);
  worldGroup.add(fireMesh);
  const fireLight = new THREE.PointLight(0xff6600, 5, 12);
  fireLight.position.set(1, 1.2, -4);
  worldGroup.add(fireLight);

  // ====== STONE WELL ======
  const wellGroup = new THREE.Group();
  wellGroup.position.set(-2, 0, -6);
  // Base cylinder
  const wellBaseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.8, 12);
  const wellBase = new THREE.Mesh(wellBaseGeo, stoneMat);
  wellBase.position.y = 0.4;
  wellBase.castShadow = true;
  wellGroup.add(wellBase);
  // Inner water
  const wellWaterGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 12);
  const wellWater = new THREE.Mesh(wellWaterGeo, waterMat);
  wellWater.position.y = 0.7;
  wellGroup.add(wellWater);
  // Supports
  const wellPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6);
  const wellPost1 = new THREE.Mesh(wellPostGeo, woodMat);
  wellPost1.position.set(-0.6, 1.2, 0);
  wellPost1.castShadow = true;
  wellGroup.add(wellPost1);
  const wellPost2 = new THREE.Mesh(wellPostGeo, woodMat);
  wellPost2.position.set(0.6, 1.2, 0);
  wellPost2.castShadow = true;
  wellGroup.add(wellPost2);
  // Roof beam
  const wellRoofGeo = new THREE.BoxGeometry(1.6, 0.08, 0.5);
  const wellRoof = new THREE.Mesh(wellRoofGeo, woodMat);
  wellRoof.position.y = 1.95;
  wellGroup.add(wellRoof);
  worldGroup.add(wellGroup);

  // ====== MARKET STALL ======
  const marketGroup = new THREE.Group();
  marketGroup.position.set(3, 0, -6);
  // Counter
  const counterGeo = new THREE.BoxGeometry(3, 1, 1.2);
  const counterMat = new THREE.MeshStandardNodeMaterial({ color: 0x795548, roughness: 0.8 });
  const counter = new THREE.Mesh(counterGeo, counterMat);
  counter.position.y = 0.5;
  counter.castShadow = true;
  counter.receiveShadow = true;
  marketGroup.add(counter);
  // Awning posts
  const awningPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6);
  [-1.4, 1.4].forEach(xOff => {
    const post = new THREE.Mesh(awningPostGeo, woodMat);
    post.position.set(xOff, 1.25, -0.5);
    post.castShadow = true;
    marketGroup.add(post);
  });
  // Awning (cloth)
  const awningGeo = new THREE.BoxGeometry(3.2, 0.05, 1.8);
  const awningMat = new THREE.MeshStandardNodeMaterial({ color: 0xc62828, roughness: 0.8 });
  const awning = new THREE.Mesh(awningGeo, awningMat);
  awning.position.set(0, 2.5, -0.2);
  awning.rotation.x = -0.15;
  awning.castShadow = true;
  marketGroup.add(awning);
  // Goods on counter (boxes)
  const crateGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const crateMat = new THREE.MeshStandardNodeMaterial({ color: 0xa1887f, roughness: 0.9 });
  [-0.8, 0, 0.8].forEach(xOff => {
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.set(xOff, 1.2, 0);
    crate.rotation.y = Math.random() * 0.5;
    crate.castShadow = true;
    marketGroup.add(crate);
  });
  worldGroup.add(marketGroup);

  // ====== POND & DOCK ======
  const pondGeo = new THREE.CylinderGeometry(3, 3.5, 0.15, 24);
  const pond = new THREE.Mesh(pondGeo, waterMat);
  pond.position.set(-7, -0.02, -10);
  pond.receiveShadow = true;
  worldGroup.add(pond);
  // Dock planks
  const dockGroup = new THREE.Group();
  const plankGeo = new THREE.BoxGeometry(1.2, 0.08, 0.25);
  for (let i = 0; i < 6; i++) {
    const plank = new THREE.Mesh(plankGeo, woodMat);
    plank.position.set(-5.5, 0.08, -10 + i * 0.3 - 0.75);
    plank.castShadow = true;
    dockGroup.add(plank);
  }
  // Dock supports
  const dockLegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
  [[-5.0, -10.6], [-5.0, -9.4], [-6.0, -10.6], [-6.0, -9.4]].forEach(([dx, dz]) => {
    const leg = new THREE.Mesh(dockLegGeo, darkWoodMat);
    leg.position.set(dx, -0.1, dz);
    dockGroup.add(leg);
  });
  worldGroup.add(dockGroup);

  // ====== FULL PERIMETER FENCING (Farm) ======
  const fencePostGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
  const fenceBeamGeo = new THREE.BoxGeometry(STATE.tileSize, 0.05, 0.05);
  const fenceMat = new THREE.MeshStandardNodeMaterial({ color: 0x5d4037, roughness: 0.9 });
  const pStartX = 3 - (STATE.tileSize * 3);
  const pEndX = 3 + (STATE.tileSize * 3);
  const pStartZ = 2 - (STATE.tileSize * 2);
  const pEndZ = 2 + (STATE.tileSize * 2);

  // Helper to draw a fence row
  function drawFenceRow(x1: number, z1: number, x2: number, z2: number, axis: 'x' | 'z') {
    if (axis === 'x') {
      for (let x = x1; x <= x2; x += STATE.tileSize) {
        const post = new THREE.Mesh(fencePostGeo, fenceMat);
        post.position.set(x, 0.4, z1);
        post.castShadow = true;
        worldGroup.add(post);
        if (x < x2) {
          const beam = new THREE.Mesh(fenceBeamGeo, fenceMat);
          beam.position.set(x + STATE.tileSize/2, 0.6, z1);
          worldGroup.add(beam);
        }
      }
    } else {
      const beamZ = new THREE.BoxGeometry(0.05, 0.05, STATE.tileSize);
      for (let z = z1; z <= z2; z += STATE.tileSize) {
        const post = new THREE.Mesh(fencePostGeo, fenceMat);
        post.position.set(x1, 0.4, z);
        post.castShadow = true;
        worldGroup.add(post);
        if (z < z2) {
          const beam = new THREE.Mesh(beamZ, fenceMat);
          beam.position.set(x1, 0.6, z + STATE.tileSize/2);
          worldGroup.add(beam);
        }
      }
    }
  }
  drawFenceRow(pStartX, pStartZ, pEndX, pStartZ, 'x'); // North
  drawFenceRow(pStartX, pEndZ, pEndX, pEndZ, 'x');     // South
  drawFenceRow(pStartX, pStartZ, pStartX, pEndZ, 'z'); // West
  drawFenceRow(pEndX, pStartZ, pEndX, pEndZ, 'z');     // East

  // ====== SCATTERED ROCKS ======
  const rockGeo = new THREE.DodecahedronGeometry(0.3, 0);
  for (let i = 0; i < 25; i++) {
    const rock = new THREE.Mesh(rockGeo, stoneMat);
    const rx = (Math.random() - 0.5) * 20;
    const rz = (Math.random() - 0.5) * 20;
    if (rx > pStartX - 1 && rx < pEndX + 1 && rz > pStartZ - 1 && rz < pEndZ + 1) continue;
    rock.position.set(rx, 0.05, rz);
    rock.scale.set(0.5 + Math.random(), 0.3 + Math.random() * 0.4, 0.5 + Math.random());
    rock.rotation.y = Math.random() * Math.PI;
    rock.castShadow = true;
    worldGroup.add(rock);
  }

  // ====== WILDFLOWERS ======
  const flowerColors = [0xff4081, 0xffeb3b, 0x7c4dff, 0x00e5ff, 0xff6e40];
  for (let i = 0; i < 60; i++) {
    const fx = (Math.random() - 0.5) * 24;
    const fz = (Math.random() - 0.5) * 24;
    if (fx > -7 && fx < 10 && fz > -2 && fz < 6) continue; // skip farm zone
    const petalGeo = new THREE.SphereGeometry(0.08, 6, 4);
    const petalMat = new THREE.MeshStandardNodeMaterial({
      color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
      roughness: 0.6
    });
    const flower = new THREE.Mesh(petalGeo, petalMat);
    flower.position.set(fx, 0.1, fz);
    worldGroup.add(flower);
    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 4);
    const stemMat = new THREE.MeshStandardNodeMaterial({ color: 0x388e3c, roughness: 0.8 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(fx, 0.04, fz);
    worldGroup.add(stem);
  }

  // ====== BUSHES ======
  const bushGeo = new THREE.SphereGeometry(0.5, 8, 6);
  for (let i = 0; i < 20; i++) {
    const bx = (Math.random() - 0.5) * 22;
    const bz = (Math.random() - 0.5) * 22;
    if (bx > -7 && bx < 10 && bz > -2 && bz < 6) continue;
    const mat = Math.random() > 0.5 ? leafGreenMat : lightLeafMat;
    const bush = new THREE.Mesh(bushGeo, mat);
    bush.position.set(bx, 0.25, bz);
    bush.scale.set(0.6 + Math.random() * 0.8, 0.5 + Math.random() * 0.4, 0.6 + Math.random() * 0.8);
    bush.castShadow = true;
    worldGroup.add(bush);
  }

  // ====== LOG PILE (near house) ======
  const logGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 6);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4 - row; col++) {
      const log = new THREE.Mesh(logGeo, darkWoodMat);
      log.rotation.z = Math.PI / 2;
      log.position.set(-6.5 + col * 0.22 + row * 0.11, 0.12 + row * 0.21, -3);
      log.castShadow = true;
      worldGroup.add(log);
    }
  }

  // ====== MAILBOX (by house) ======
  const mailPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
  const mailPost = new THREE.Mesh(mailPostGeo, woodMat);
  mailPost.position.set(-2.5, 0.5, -3);
  mailPost.castShadow = true;
  worldGroup.add(mailPost);
  const mailBoxGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
  const mailBoxMat = new THREE.MeshStandardNodeMaterial({ color: 0x1565c0, roughness: 0.6 });
  const mailBox = new THREE.Mesh(mailBoxGeo, mailBoxMat);
  mailBox.position.set(-2.5, 1.05, -3);
  mailBox.castShadow = true;
  worldGroup.add(mailBox);

  // ====== DENSE TREE RING (Forest Boundary) ======
  const treeGeo = new THREE.ConeGeometry(1.2, 3, 5);
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1);

  for (let i = 0; i < 80; i++) {
    const r = 12 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const tx = Math.cos(theta) * r;
    const tz = Math.sin(theta) * r;

    const tree = new THREE.Group();
    const scale = 0.7 + Math.random() * 0.8;
    const trunk = new THREE.Mesh(trunkGeo, darkWoodMat);
    trunk.position.y = 0.5 * scale;
    trunk.scale.setScalar(scale);
    trunk.castShadow = true;
    const leafMat = Math.random() > 0.3 ? leafGreenMat : lightLeafMat;
    const leaves = new THREE.Mesh(treeGeo, leafMat);
    leaves.position.y = 2.5 * scale;
    leaves.scale.setScalar(scale);
    leaves.castShadow = true;
    tree.add(trunk);
    tree.add(leaves);
    tree.position.set(tx, 0, tz);
    worldGroup.add(tree);
  }

  // ====== OUTER BOUNDS DETAIL ======
  // Low perimeter wall + lantern posts to make the map edge feel intentional.
  const borderMat = new THREE.MeshStandardNodeMaterial({ color: 0x4e342e, roughness: 0.95 });
  const wallThickness = 0.6;
  const wallHeight = 0.9;
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(mapSize, wallHeight, wallThickness), borderMat);
  northWall.position.set(0, wallHeight * 0.5 - 0.02, -mapHalfSize);
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(mapSize, wallHeight, wallThickness), borderMat);
  southWall.position.set(0, wallHeight * 0.5 - 0.02, mapHalfSize);
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize), borderMat);
  westWall.position.set(-mapHalfSize, wallHeight * 0.5 - 0.02, 0);
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize), borderMat);
  eastWall.position.set(mapHalfSize, wallHeight * 0.5 - 0.02, 0);
  [northWall, southWall, westWall, eastWall].forEach((w) => {
    w.castShadow = true;
    w.receiveShadow = true;
    worldGroup.add(w);
  });

  const lanternMat = new THREE.MeshStandardNodeMaterial({ color: 0xffc107, roughness: 0.3, metalness: 0.1 });
  const lanternPostMat = new THREE.MeshStandardNodeMaterial({ color: 0x6d4c41, roughness: 0.9 });
  for (let i = -1; i <= 1; i++) {
    const offset = i * (mapSize * 0.3);
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), lanternPostMat);
    post1.position.set(offset, 0.8, -mapHalfSize + 0.5);
    const light1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lanternMat);
    light1.position.set(offset, 1.55, -mapHalfSize + 0.5);
    const post2 = post1.clone();
    post2.position.z = mapHalfSize - 0.5;
    const light2 = light1.clone();
    light2.position.z = mapHalfSize - 0.5;
    [post1, light1, post2, light2].forEach((obj) => worldGroup.add(obj));
  }

  // Soft collision blockers near perimeter to make edges feel organic.
  // Player can still move freely in-town but gets nudged away from dense edge clutter.
  const hedgeMat = new THREE.MeshStandardNodeMaterial({ color: 0x2e7d32, roughness: 0.9 });
  const borderRockMat = new THREE.MeshStandardNodeMaterial({ color: 0x757575, roughness: 0.95 });
  const blockerRingRadius = mapHalfSize - 1.4;
  const blockerCount = 42;
  for (let i = 0; i < blockerCount; i++) {
    const theta = (i / blockerCount) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 1.2;
    const x = Math.cos(theta) * (blockerRingRadius + jitter);
    const z = Math.sin(theta) * (blockerRingRadius + jitter);
    const blockerRadius = 0.65 + Math.random() * 0.35;

    if (Math.random() > 0.35) {
      const hedge = new THREE.Mesh(new THREE.SphereGeometry(0.55 + Math.random() * 0.3, 8, 6), hedgeMat);
      hedge.position.set(x, 0.35, z);
      hedge.scale.y = 0.7 + Math.random() * 0.3;
      hedge.castShadow = true;
      hedge.receiveShadow = true;
      worldGroup.add(hedge);
    } else {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.25, 0), borderRockMat);
      rock.position.set(x, 0.18, z);
      rock.scale.y = 0.6 + Math.random() * 0.5;
      rock.castShadow = true;
      rock.receiveShadow = true;
      worldGroup.add(rock);
    }

    edgeBlockers.push({ x, z, radius: blockerRadius });
  }
  
  // --- PLAYER ENTITY ---
  const playerMesh = new THREE.Group();
  playerMeshRef = playerMesh;
  playerMesh.position.set(0, 0, 2); // Start near plot
  
  // Amorphous skin material
  const fleshMat = new THREE.MeshStandardNodeMaterial({ color: 0xffccaa, roughness: 0.6 });
  
  // Torso
  const torsoGeo = new THREE.CapsuleGeometry(0.25, 0.4, 4, 16);
  const torso = new THREE.Mesh(torsoGeo, fleshMat);
  torso.position.y = 0.7;
  torso.castShadow = true;
  playerMesh.add(torso);
  
  // Bald Head
  const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const head = new THREE.Mesh(headGeo, fleshMat);
  head.position.y = 1.25;
  head.castShadow = true;
  playerMesh.add(head);
  
  // Empty, staring eyes
  const eyeMat = new THREE.MeshBasicNodeMaterial({ color: 0x222222 });
  const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.1, 1.3, 0.25);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.1, 1.3, 0.25);
  playerMesh.add(leftEye);
  playerMesh.add(rightEye);
  
  // Floppy Arms
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, fleshMat);
  leftArm.position.set(-0.35, 0.75, 0);
  leftArm.rotation.z = Math.PI / 8;
  leftArm.castShadow = true;
  const rightArm = new THREE.Mesh(armGeo, fleshMat);
  rightArm.position.set(0.35, 0.75, 0);
  rightArm.rotation.z = -Math.PI / 8;
  rightArm.castShadow = true;
  playerMesh.add(leftArm);
  playerMesh.add(rightArm);
  
  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.35, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, fleshMat);
  leftLeg.position.set(-0.12, 0.25, 0);
  leftLeg.castShadow = true;
  const rightLeg = new THREE.Mesh(legGeo, fleshMat);
  rightLeg.position.set(0.12, 0.25, 0);
  rightLeg.castShadow = true;
  playerMesh.add(leftLeg);
  playerMesh.add(rightLeg);
  
  scene.add(playerMesh);
  
  // Selector Highlight
  const highlightGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(STATE.tileSize, 0.2, STATE.tileSize));
  const highlightMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
  const highlightMesh = new THREE.LineSegments(highlightGeo, highlightMat);
  scene.add(highlightMesh);
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  const npcManager = new NPCManager(scene);
  
  // Game Loop Variables
  let lastTime = performance.now();
  let spacePressedLast = false;
  
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    
    // Core Clock Tick
    STATE.gameTime += dt * STATE.timeScale * 60;
    if (STATE.gameTime >= 24 * 60) {
      STATE.gameTime = 0;
      STATE.day += 1;
      // Daily Reset: Crops dry out
      cropGrid.forEach(c => c.isWatered = false);
      showToast(`Day ${STATE.day} has begun! Water your crops.`, 'info');
    }
    
    // Update Isolated Systems
    npcManager.update(dt, now);
    
    // Player Movement (WASD) with smooth logic
    const baseSpeed = 4.0;
    const moveSpeed = keys.shift ? baseSpeed * 1.8 : baseSpeed;
    const velocity = new THREE.Vector3(0, 0, 0);
    
    if (!shopOpen) {
      if (keys.w) velocity.z -= 1;
      if (keys.s) velocity.z += 1;
      if (keys.a) velocity.x -= 1;
      if (keys.d) velocity.x += 1;
    }
    
    if (velocity.length() > 0) {
      velocity.normalize().multiplyScalar(moveSpeed * dt);
      playerMesh.position.add(velocity);
      playerMesh.position.x = THREE.MathUtils.clamp(playerMesh.position.x, worldBounds.minX, worldBounds.maxX);
      playerMesh.position.z = THREE.MathUtils.clamp(playerMesh.position.z, worldBounds.minZ, worldBounds.maxZ);

      // Resolve soft collisions against edge blockers.
      for (const blocker of edgeBlockers) {
        const dx = playerMesh.position.x - blocker.x;
        const dz = playerMesh.position.z - blocker.z;
        const distSq = dx * dx + dz * dz;
        const minDist = blocker.radius + 0.45;
        if (distSq > 0 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const push = minDist - dist;
          playerMesh.position.x += (dx / dist) * push;
          playerMesh.position.z += (dz / dist) * push;
        }
      }
      
      // Smooth Rotation LERP
      const targetAngle = Math.atan2(velocity.x, velocity.z);
      // Math to find shortest rotation path
      let diff = targetAngle - playerMesh.rotation.y;
      while(diff < -Math.PI) diff += Math.PI * 2;
      while(diff > Math.PI) diff -= Math.PI * 2;
      playerMesh.rotation.y += diff * 10 * dt;
      
      // Walking Bob Animation
      playerMesh.position.y = Math.abs(Math.sin(now * 0.015)) * 0.2;
      
      // Swing arms and legs
      const swing = Math.sin(now * 0.015);
      leftArm.rotation.x = swing;
      rightArm.rotation.x = -swing;
      leftLeg.rotation.x = -swing;
      rightLeg.rotation.x = swing;

      // Footstep sound
      if (Math.abs(swing) > 0.95) {
          // Play subtle thud
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(60, now);
          gain.gain.setValueAtTime(0.02, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
      }
    } else {
      // Settle to ground
      playerMesh.position.y = THREE.MathUtils.lerp(playerMesh.position.y, 0.0, 10 * dt);
      
      // Reset limbs
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 10 * dt);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 10 * dt);
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 10 * dt);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 10 * dt);
    }
    
    // Determine Grid Snapping via Mouse Raycast
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    const gridX = Math.round(intersectPoint.x / STATE.tileSize) * STATE.tileSize;
    const gridZ = Math.round(intersectPoint.z / STATE.tileSize) * STATE.tileSize;
    
    lastGridX = gridX;
    lastGridZ = gridZ;
    let lastTileKey = "";
    if (lastGridX !== null && lastGridZ !== null) {
        lastTileKey = `${lastGridX},${lastGridZ}`;
    }

    highlightMesh.position.set(gridX, 0.1, gridZ);
    
    // Interaction System (Spacebar)
    if (keys.space && !spacePressedLast) {
      handleInteraction(gridX, gridZ, scene);
    }
    spacePressedLast = keys.space;
    
    // Crop Update Loop
    updateCrops(dt);
    
    // Camera follow player (isometric angle) with zoom
    const camPanSpeed = 8 * dt;
    if (keys.arrowup) cameraPan.z -= camPanSpeed;
    if (keys.arrowdown) cameraPan.z += camPanSpeed;
    if (keys.arrowleft) cameraPan.x -= camPanSpeed;
    if (keys.arrowright) cameraPan.x += camPanSpeed;
    cameraPan.x = THREE.MathUtils.clamp(cameraPan.x, -6, 6);
    cameraPan.z = THREE.MathUtils.clamp(cameraPan.z, -6, 6);

    const zoom = STATE.cameraZoom;
    camera.position.x = playerMesh.position.x + cameraPan.x + (8 * zoom);
    camera.position.z = playerMesh.position.z + cameraPan.z + (10 * zoom);
    camera.position.y = 10 * zoom;
    camera.lookAt(
      playerMesh.position.x + cameraPan.x * 0.4,
      playerMesh.position.y,
      playerMesh.position.z + cameraPan.z * 0.4
    );
    
    // Sky/Light color shift based on time of day
    const hour = STATE.gameTime / 60;
    if (hour > 18 || hour < 6) {
      sunLight.intensity = Math.max(0.1, sunLight.intensity - dt);
      sunLight.color.setHex(0x3a4f66); // Night blue
    } else if (hour > 16) {
      sunLight.intensity = 1.5;
      sunLight.color.setHex(0xffa751); // Sunset orange
    } else {
      sunLight.intensity = Math.min(2.0, sunLight.intensity + dt);
      sunLight.color.setHex(0xffffff); // Day white
    }
    
    // Fire flicker animation
    fireMesh.rotation.y += dt * 3;
    fireMesh.scale.setScalar(0.8 + Math.sin(now * 0.01) * 0.3);
    fireLight.intensity = 4 + Math.sin(now * 0.02) * 2 + Math.sin(now * 0.05) * 1;
    
    // UI: FF Button Visibility
    const ffBtn = document.getElementById('ff-btn');
    if (ffBtn) {
      if (hour > 20 || hour < 5) ffBtn.classList.remove('hidden');
      else ffBtn.classList.add('hidden');
    }

    // Auto-switch Harvest tool logic
    if (cropGrid.has(lastTileKey)) {
        const crop = cropGrid.get(lastTileKey);
        if (crop.isReady) {
            document.querySelector('.slot[data-slot="3"]')?.classList.add('active-tip');
            // Auto-switch logic (only if not already on slot 3)
            if (STATE.activeSlot !== 3) {
                const now = performance.now();
                if (!crop.lastAutoSwitch || now - crop.lastAutoSwitch > 2000) {
                     selectSlot(3);
                     crop.lastAutoSwitch = now;
                }
            }
        } else {
            document.querySelector('.slot[data-slot="3"]')?.classList.remove('active-tip');
        }
    }

    updateUI();
    renderer.render(scene, camera);
  });
}

// --- FARMING LOGIC ---
function handleInteraction(x: number, z: number, scene: THREE.Scene) {
  const tileKey = `${x},${z}`;
  const slotData = STATE.inventory[STATE.activeSlot];
  
  if (slotData.type === 'harvest') {
    // Attempt harvest
    if (cropGrid.has(tileKey)) {
      const crop = cropGrid.get(tileKey);
      if (crop.isReady) {
        scene.remove(crop.mesh);
        cropGrid.delete(tileKey);
        
        const payout = crop.price;
        STATE.gold += payout;
        showToast(`Harvested ${crop.type}! <b>+${payout} G</b>`, 'success');
        document.querySelector('.wallet-panel')?.classList.add('bump');
        setTimeout(() => document.querySelector('.wallet-panel')?.classList.remove('bump'), 200);
      } else {
        showToast(`Not ready to harvest yet.`, 'info');
      }
    }
  } else if (slotData.type === 'water') {
    // Well refill check
    const wellPos = new THREE.Vector3(-2, 0, -6);
    if (!playerMeshRef) return;
    const distToWell = playerMeshRef.position.distanceTo(wellPos);
    
    if (distToWell < 2.5) {
      slotData.qty = slotData.maxQty || 10;
      showToast(`Refilled Watering Can!`, 'success');
    } else {
      // Hydrate crop
      if (cropGrid.has(tileKey)) {
        if (slotData.qty > 0) {
          const crop = cropGrid.get(tileKey);
          if (!crop.isWatered) {
            slotData.qty -= 1;
            crop.isWatered = true;
            showToast(`Watered the ${crop.type}!`, 'info');
          } else {
            showToast(`Already watered today.`, 'info');
          }
        } else {
          triggerErrorSlot();
          showToast(`Watering can is empty! Refill at the well.`, 'warning');
        }
      }
    }
  } else {
    // Attempt plant
    if (slotData.qty > 0) {
      if (!cropGrid.has(tileKey)) {
        slotData.qty -= 1;
        
        const mesh = createSeedMesh();
        mesh.position.set(x, 0.2, z);
        mesh.scale.setScalar(0.1); 
        scene.add(mesh);
        
        cropGrid.set(tileKey, {
          type: slotData.type,
          timer: 0,
          growTime: slotData.growTime,
          price: slotData.price,
          mesh: mesh,
          isReady: false,
          isWatered: false,
          popAnim: 0 
        });
        showToast(`Planted ${slotData.type}!`, 'info');
      } else {
        triggerErrorSlot();
        showToast(`Tile is already occupied.`, 'warning');
      }
    } else {
      triggerErrorSlot();
      showToast(`Out of ${slotData.type} seeds!`, 'warning');
    }
  }
}

function triggerErrorSlot() {
  const slot = document.querySelector(`.slot[data-slot="${STATE.activeSlot}"]`);
  if (slot) {
    slot.classList.remove('error');
    void (slot as HTMLElement).offsetWidth; // trigger reflow
    slot.classList.add('error');
  }
}

function updateCrops(dt: number) {
  const now = performance.now();
  cropGrid.forEach((crop) => {
    // Pop animation logic
    if (crop.popAnim < 1.0) {
      crop.popAnim = Math.min(1.0, crop.popAnim + dt * 5);
      const s = Math.sin(crop.popAnim * Math.PI) * 0.5 + 1.0;
      if (!crop.isReady) {
        crop.mesh.scale.setScalar(s * (0.2 + (crop.timer / crop.growTime * 0.8)));
      }
    }

    if (!crop.isReady) {
      // Only grow if hydrated
      if (crop.isWatered) {
        crop.timer += dt * STATE.timeScale; 
      }
      
      const progress = crop.timer / crop.growTime;
      const baseScale = 0.2 + (progress * 0.8); 
      
      // Visual feedback for water (darker if watered)
      if (crop.isWatered) {
        const c = 0.8 - (Math.sin(now * 0.01) * 0.1);
        crop.mesh.traverse((m: any) => { if(m.isMesh) m.material.color?.setRGB(c, c, c + 0.1); });
      } else {
        crop.mesh.traverse((m: any) => { if(m.isMesh) m.material.color?.setRGB(1, 1, 1); });
      }

      // If pop animation is done, just set normal scale
      if (crop.popAnim >= 1.0) {
        crop.mesh.scale.setScalar(baseScale);
      }
      
      if (progress >= 1.0) {
        crop.isReady = true;
        // Transform mesh into full plant
        replaceMeshWithFullPlant(crop);
      }
    }
  });
}

function createSeedMesh() {
  const geo = new THREE.SphereGeometry(0.2, 8, 8);
  const mat = new THREE.MeshStandardNodeMaterial({ color: 0x8d5524 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function replaceMeshWithFullPlant(crop: any) {
  const pos = crop.mesh.position.clone();
  crop.mesh.parent?.remove(crop.mesh); // Remove seed
  
  const group = new THREE.Group();
  group.position.copy(pos);
  
  if (crop.type === 'carrot') {
    const geo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const mat = new THREE.MeshStandardNodeMaterial({ color: 0xff9800 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.4;
    mesh.castShadow = true;
    group.add(mesh);
    
    // Leaves
    const leafGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    const leafMat = new THREE.MeshStandardNodeMaterial({ color: 0x4caf50 });
    for(let i=0; i<3; i++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.y = 0.9;
        leaf.rotation.z = (Math.random() - 0.5);
        leaf.rotation.x = (Math.random() - 0.5);
        group.add(leaf);
    }
  } else if (crop.type === 'flower') {
    const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
    const stemMat = new THREE.MeshStandardNodeMaterial({ color: 0x4caf50 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.4;
    group.add(stem);
    
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const headMat = new THREE.MeshStandardNodeMaterial({ color: 0xff4081 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.8;
    group.add(head);
  }
  
  window.dispatchEvent(new Event('resize')); 
  const parent = crop.mesh.parent;
  if(parent) {
      parent.remove(crop.mesh);
      parent.add(group);
  }
  crop.mesh = group;
}

init().then(() => {
  setTimeout(showChangelogModal, 1500);
}).catch(console.error);

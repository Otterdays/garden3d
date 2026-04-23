import * as THREE from 'three/webgpu';
import { AREA_LABELS, AREA_TRAVEL_BLURBS, AREA_TRAVEL_ORDER, type AreaId } from './config/areaConfig';
import { APP_VERSION, HARVEST_SLOT_INDEX, HOTBAR_SLOT_COUNT } from './config/gameConstants';
import { cropGrid, STATE } from './state/gameState';
import { makeEmptySaveV1, type GameSaveV1, type SavedCropV1 } from './save/saveFormat';
import {
  applySaveToState,
  buildGameSave,
  clearSaveStorageOnly,
  mergeImportedJson,
  readSaveFromLocalStorage,
  writeSaveToLocalStorage
} from './save/persistence';
import { setWorldBoundsForMap, type EdgeBlocker } from './config/worldConfig';
import { updateFollowCamera } from './systems/followCamera';
import { updatePlayerMovement } from './systems/playerMovement';
import { devCountHarvest, devCountPlant, devCountWater } from './dev/devCounters';
import { NPCManager } from './entities/NPCManager';
import { ensureCropBar, getBarYLocal, removeCropBar, updateAllCropBars3D } from './entities/cropProgressBar3D';
import { buildAreas, type BuiltArea } from './world/areaBuilder';

let playerMeshRef: THREE.Group | null = null;
const cameraPan = new THREE.Vector3(0, 0, 0);
const edgeBlockers: EdgeBlocker[] = [];
let activeArea: BuiltArea | null = null;
let worldAreas: Record<AreaId, BuiltArea> | null = null;

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

// Shop + Data modals, pause, inventory
let shopOpen = false;
let dataModalOpen = false;
let pauseMenuOpen = false;
let pauseSettingsView = false;
let inventoryOpen = false;

function anyModalOpen() {
  return shopOpen || dataModalOpen;
}
/** True while escape menu is up — world simulation stops. */
function isWorldPaused() {
  return pauseMenuOpen;
}
/** Block movement, camera pan, and tool wheel (not inventory alone). */
function inputBlockedForMoveAndWheel() {
  return anyModalOpen() || pauseMenuOpen;
}
/** Block world clicks / some UI (includes inventory to avoid mis-clicks on canvas). */
function inputBlockedForCanvas() {
  return anyModalOpen() || pauseMenuOpen || inventoryOpen;
}
function setDataModalOpen(open: boolean) {
  dataModalOpen = open;
  const modal = document.getElementById('data-modal');
  if (open) {
    if (pauseMenuOpen) setPauseMenuOpen(false);
    if (inventoryOpen) setInventoryOpen(false);
    modal?.classList.remove('hidden');
    modal?.setAttribute('aria-hidden', 'false');
  } else {
    modal?.classList.add('hidden');
    modal?.setAttribute('aria-hidden', 'true');
  }
}

function getNextAreaId(areaId: AreaId): AreaId {
  const idx = AREA_TRAVEL_ORDER.indexOf(areaId);
  return AREA_TRAVEL_ORDER[(idx + 1) % AREA_TRAVEL_ORDER.length];
}

function updateTravelUi(areaId: AreaId) {
  const areaLabelEl = document.getElementById('area-label');
  if (areaLabelEl) areaLabelEl.textContent = AREA_LABELS[areaId];

  const travelBtn = document.getElementById('travel-btn');
  if (travelBtn) {
    travelBtn.textContent = `Travel: ${AREA_LABELS[getNextAreaId(areaId)]}`;
  }
}

function isWithinFarmPlot(x: number, z: number): boolean {
  const bounds = activeArea?.farmBounds;
  if (!bounds) return false;
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

function isFarmPlotTile(tileKey: string): boolean {
  const [rawX, rawZ] = tileKey.split(',');
  return isWithinFarmPlot(Number(rawX), Number(rawZ));
}

function setPauseMenuOpen(open: boolean) {
  pauseMenuOpen = open;
  const modal = document.getElementById('pause-modal');
  if (open) {
    if (inventoryOpen) setInventoryOpen(false);
    pauseSettingsView = false;
    if (anyModalOpen()) {
      if (dataModalOpen) setDataModalOpen(false);
      if (shopOpen) toggleShop();
    }
    modal?.classList.remove('hidden');
    modal?.setAttribute('aria-hidden', 'false');
  } else {
    modal?.classList.add('hidden');
    modal?.setAttribute('aria-hidden', 'true');
    pauseSettingsView = false;
    clearHeldInputKeys();
  }
  syncPauseSubpanels();
}
function setPauseSettingsView(view: 'main' | 'settings') {
  pauseSettingsView = view === 'settings';
  syncPauseSubpanels();
}
function syncPauseSubpanels() {
  const main = document.getElementById('pause-main');
  const settings = document.getElementById('pause-settings');
  if (!main || !settings) return;
  const showSettings = pauseMenuOpen && pauseSettingsView;
  main.classList.toggle('hidden', showSettings);
  settings.classList.toggle('hidden', !showSettings);
}
function setInventoryOpen(open: boolean) {
  inventoryOpen = open;
  const p = document.getElementById('inventory-panel');
  if (open) {
    p?.classList.remove('hidden');
  } else {
    p?.classList.add('hidden');
  }
}
function toggleInventory() {
  if (pauseMenuOpen) return;
  setInventoryOpen(!inventoryOpen);
  playSound('click');
  updateInventoryPanelContent();
}
function updateInventoryPanelContent() {
  const g = document.getElementById('inv-gold');
  const a = document.getElementById('inv-carrot');
  const b = document.getElementById('inv-flower');
  const c = document.getElementById('inv-tomato');
  const w = document.getElementById('inv-water');
  if (g) g.textContent = STATE.gold.toString();
  if (a) a.textContent = STATE.inventory[0].qty.toString();
  if (b) b.textContent = STATE.inventory[1].qty.toString();
  if (c) c.textContent = STATE.inventory[2].qty.toString();
  if (w) w.textContent = STATE.inventory[3].qty.toString();
}
function toggleShop(playerPos?: THREE.Vector3) {
  if (!shopOpen && playerPos) {
    const stallPos = activeArea?.marketPos;
    if (!stallPos || playerPos.distanceTo(stallPos) > 4) {
      showToast("Must be near the Market Stall to trade!", "warning");
      return;
    }
  }

  shopOpen = !shopOpen;
  if (shopOpen) {
    if (pauseMenuOpen) setPauseMenuOpen(false);
    if (inventoryOpen) setInventoryOpen(false);
    if (dataModalOpen) setDataModalOpen(false);
  }
  const modal = document.getElementById('shop-modal');
  if (shopOpen) {
    modal?.classList.remove('hidden');
    modal?.setAttribute('aria-hidden', 'false');
    document.querySelector('.wallet-panel')?.classList.add('bump');
  } else {
    modal?.classList.add('hidden');
    modal?.setAttribute('aria-hidden', 'true');
    document.querySelector('.wallet-panel')?.classList.remove('bump');
  }
}

// Inputs
const keys = {
  w: false, a: false, s: false, d: false, f: false, space: false, shift: false,
  arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
};
function clearHeldInputKeys() {
  keys.w = false;
  keys.a = false;
  keys.s = false;
  keys.d = false;
  keys.f = false;
  keys.space = false;
  keys.shift = false;
  keys.arrowup = false;
  keys.arrowdown = false;
  keys.arrowleft = false;
  keys.arrowright = false;
}
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Only treat clicks on the 3D canvas as world actions — not hotbar / HUD (those use click + different target).
const gameCanvasEl = document.getElementById('canvas');
window.addEventListener('mousedown', (e) => {
  if (inputBlockedForCanvas()) return;
  if (e.target !== gameCanvasEl) return;
  // Queue click interaction so it resolves against the current frame's grid target.
  mouseInteractionRequested = true;
});

let mouseInteractionRequested = false;
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
  if (e.key === '5') selectSlot(4);
  
  if (e.key === 'b') toggleShop(playerMeshRef?.position);
  if (e.key === 'e' || e.key === 'E') {
    toggleInventory();
  }
  if (e.key === 'Escape') {
    if (pauseSettingsView) {
      setPauseSettingsView('main');
      return;
    }
    if (inventoryOpen) {
      setInventoryOpen(false);
      return;
    }
    if (dataModalOpen) {
      setDataModalOpen(false);
      return;
    }
    if (shopOpen) {
      toggleShop();
      return;
    }
    if (pauseMenuOpen) {
      setPauseMenuOpen(false);
      return;
    }
    setPauseMenuOpen(true);
  }
});

// Wheel: default cycles hotbar; Shift+Wheel zooms the camera.
window.addEventListener('wheel', e => {
  if (inputBlockedForMoveAndWheel()) return;
  if (e.shiftKey) {
    STATE.cameraZoom = Math.max(0.5, Math.min(2.0, STATE.cameraZoom + (e.deltaY * 0.001)));
  } else {
    const last = HOTBAR_SLOT_COUNT - 1;
    let newSlot = STATE.activeSlot + (e.deltaY > 0 ? 1 : -1);
    if (newSlot < 0) newSlot = last;
    if (newSlot > last) newSlot = 0;
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
    <h3 style="color:#a8ff78;margin:1.2rem 0 0.5rem 0;">${APP_VERSION}</h3>
    <ul style="list-style:none;padding:0;margin:0;">
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Changelog modal for version tracking</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Auto-shows on game start with recent changes</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Farmstead overhaul: proper perimeter walls, cleaner land shaping, raised crop beds, orchard details</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> New travelable zone: <strong>Ironwood Reach</strong> with a ruined gate, overlook, shrine, and darker exploration vibe</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Top-corner <strong>Travel</strong> button swaps areas and now saves the current destination with your farm state</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> State split: <code>gameState.ts</code> / <code>saveFormat.ts</code> + localStorage autosave (~20s) &amp; rehydrate</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Camera &amp; walk logic in <code>src/systems/followCamera.ts</code> &amp; <code>playerMovement.ts</code></li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> <kbd>E</kbd> <strong>Backpack</strong> panel, <kbd>Esc</kbd> <strong>pause</strong> (Resume / Settings / Quit); time stops while paused</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Farm <strong>Data</strong> (💾): export / import <code>garden3d_save.json</code>, reset farm; modals block play like the market</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Neighbors: named villagers, POI wandering, proximity toasts, <kbd>F</kbd> talk prompt, speech bubbles, and focus rings</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Dev: <code>window.__garden3dStats</code> in dev build (plants / harvests / waters / saves)</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Roadmap: farming depth, NPC relationships, weather</li>
      <li style="padding:0.35rem 0;color:#ffd54f;"><strong>+</strong> Documentation synced per AGENTS.md rules</li>
    </ul>
    <div style="margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.92rem;">
      Controls: WASD move, Shift sprint, Arrow keys pan camera, Shift + Wheel zoom, 1-5 tools, Space interact, F talk, B shop, Travel button swaps zones.
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
    const target = e.currentTarget as HTMLElement;
    const type = target.dataset.type;
    const price = parseInt(target.dataset.price || '0', 10);
    
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
  if (!inputBlockedForMoveAndWheel()) {
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
  document.getElementById('qty-tomato')!.innerText = STATE.inventory[2].qty.toString();
  document.getElementById('qty-water')!.innerText = STATE.inventory[3].qty.toString();
  
  const hours = Math.floor(STATE.gameTime / 60) % 24;
  const mins = Math.floor(STATE.gameTime % 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hDisplay = (hours % 12 || 12).toString().padStart(2, '0');
  const mDisplay = mins.toString().padStart(2, '0');
  
  document.getElementById('time-display')!.innerText = `${hDisplay}:${mDisplay} ${ampm}`;
  document.getElementById('day-display')!.innerText = `Day ${STATE.day}`;

  const timePhaseEl = document.getElementById('time-phase');
  if (timePhaseEl) {
    const isDay = hours >= 6 && hours < 18;
    timePhaseEl.textContent = isDay ? '☀️' : '🌙';
    timePhaseEl.title = isDay ? 'Daytime' : 'Night';
  }

  document.querySelectorAll('.buy-btn').forEach((el) => {
    const b = el as HTMLButtonElement;
    const price = parseInt(b.dataset.price || '0', 10);
    b.disabled = Number.isFinite(price) && STATE.gold < price;
  });

  if (inventoryOpen) updateInventoryPanelContent();
}

function buildInteractionHint(tileKey: string): string {
  const slotData = STATE.inventory[STATE.activeSlot];
  const crop = cropGrid.get(tileKey);

  if (!activeArea?.allowsFarming) {
    return `${activeArea?.label ?? 'This area'} is for exploring, not farming. Use Travel to get back to the farm.`;
  }

  if (slotData.type === 'harvest') {
    if (!crop) return 'Harvest tool selected: no crop on this tile.';
    if (crop.isReady) return `Ready crop detected. Press Space or click to harvest ${crop.type}.`;
    return `${crop.type} is still growing. Come back later to harvest.`;
  }

  if (slotData.type === 'water') {
    if (!crop) return 'Watering can selected: aim at a planted crop tile.';
    if (slotData.qty <= 0) return 'Water can empty. Refill at the well before watering.';
    if (crop.isWatered) return `${crop.type} is already watered for today.`;
    return `Press Space or click to water ${crop.type}.`;
  }

  if (crop) return 'Tile occupied. Switch tool or pick an empty tile to plant.';
  if (!isFarmPlotTile(tileKey)) return 'Use the raised farm beds for planting. The old "plant anywhere" mess is dead.';
  if (slotData.qty <= 0) return `Out of ${slotData.type} seeds. Buy more at the market stall.`;
  return `Press Space or click to plant ${slotData.type}.`;
}

function updateInteractionHint(tileKey: string) {
  const hintEl = document.getElementById('interaction-hint');
  if (!hintEl) return;
  hintEl.textContent = buildInteractionHint(tileKey);
}

const PLANT_UI_ICONS: Record<string, string> = { carrot: '🥕', flower: '🌸', tomato: '🍅' };
const PLANT_UI_LABEL: Record<string, string> = { carrot: 'Carrot', flower: 'Flower', tomato: 'Tomato' };

function formatGrowTimeRemaining(remainingGrowUnits: number, timeScale: number): string {
  if (remainingGrowUnits <= 0) return '0s';
  const realSec = remainingGrowUnits / Math.max(0.0001, timeScale);
  if (!Number.isFinite(realSec)) return '—';
  if (realSec < 60) return `${Math.max(0, Math.ceil(realSec))}s`;
  const m = Math.floor(realSec / 60);
  const s = Math.ceil(realSec % 60);
  return `${m}m ${s}s`;
}

function updatePlantPanel(tileKey: string) {
  const panel = document.getElementById('plant-panel');
  if (!panel) return;

  if (!activeArea?.allowsFarming || !cropGrid.has(tileKey)) {
    panel.classList.add('hidden');
    panel.classList.remove('plant-panel--ready', 'plant-panel--thirsty', 'plant-panel--growing');
    return;
  }

  const crop = cropGrid.get(tileKey) as {
    type: string;
    timer: number;
    growTime: number;
    isWatered: boolean;
    isReady: boolean;
  };

  panel.classList.remove('hidden', 'plant-panel--ready', 'plant-panel--thirsty', 'plant-panel--growing');

  const iconEl = document.getElementById('plant-panel-icon');
  const titleEl = document.getElementById('plant-panel-title');
  const statusEl = document.getElementById('plant-panel-status');
  const waterLabel = document.getElementById('plant-water-label');
  const timerLabel = document.getElementById('plant-timer-label');
  const fillEl = document.getElementById('plant-progress-fill') as HTMLDivElement | null;
  const pctEl = document.getElementById('plant-progress-pct');
  const barEl = document.getElementById('plant-progress-bar');

  if (iconEl) iconEl.textContent = PLANT_UI_ICONS[crop.type] ?? '🌱';
  if (titleEl) titleEl.textContent = PLANT_UI_LABEL[crop.type] ?? crop.type;
  if (statusEl) {
    statusEl.classList.remove('state-ready', 'state-thirsty', 'state-growing');
  }

  const growT = Math.max(0.0001, crop.growTime);
  const progress = Math.min(1, crop.timer / growT);
  const pct = Math.min(100, Math.floor(progress * 100));

  if (crop.isReady) {
    panel.classList.add('plant-panel--ready');
    if (statusEl) {
      statusEl.textContent = 'Ready to harvest';
      statusEl.classList.add('state-ready');
    }
    if (waterLabel) waterLabel.textContent = '—';
    if (timerLabel) timerLabel.textContent = 'Complete';
    if (fillEl) {
      fillEl.classList.remove('plant-growth__fill--paused');
      fillEl.classList.add('plant-growth__fill--ready');
      fillEl.style.width = '100%';
    }
    if (pctEl) pctEl.textContent = '100%';
    if (barEl) {
      barEl.setAttribute('aria-valuenow', '100');
      barEl.classList.add('plant-growth__bar--dim-shine');
    }
    return;
  }

  if (fillEl) fillEl.classList.remove('plant-growth__fill--ready');

  if (crop.isWatered) {
    panel.classList.add('plant-panel--growing');
    if (statusEl) {
      statusEl.textContent = 'Growing';
      statusEl.classList.add('state-growing');
    }
    if (waterLabel) waterLabel.textContent = 'Watered (today)';
    const remain = Math.max(0, crop.growTime - crop.timer);
    if (timerLabel) timerLabel.textContent = formatGrowTimeRemaining(remain, STATE.timeScale);
    if (fillEl) {
      fillEl.classList.remove('plant-growth__fill--paused');
      fillEl.style.width = `${pct}%`;
    }
    if (barEl) barEl.classList.remove('plant-growth__bar--dim-shine');
  } else {
    panel.classList.add('plant-panel--thirsty');
    if (statusEl) {
      statusEl.textContent = 'Needs water to grow';
      statusEl.classList.add('state-thirsty');
    }
    if (waterLabel) waterLabel.textContent = 'Soil is dry';
    if (timerLabel) timerLabel.textContent = 'Paused until watered';
    if (fillEl) {
      fillEl.classList.add('plant-growth__fill--paused');
      fillEl.style.width = `${pct}%`;
    }
    if (barEl) barEl.classList.add('plant-growth__bar--dim-shine');
  }

  if (pctEl) pctEl.textContent = `${pct}%`;
  if (barEl) barEl.setAttribute('aria-valuenow', String(pct));
}

function rehydrateCropsFromSave(parent: THREE.Object3D, saved: SavedCropV1[]) {
  cropGrid.clear();
  for (const row of saved) {
    const parts = row.key.split(',');
    const x = parseFloat(parts[0] ?? '0');
    const z = parseFloat(parts[1] ?? '0');
    if (row.isReady) {
      const mesh = createSeedMesh(row.type);
      mesh.position.set(x, 0.2, z);
      parent.add(mesh);
      const crop: any = {
        type: row.type,
        timer: row.timer,
        growTime: row.growTime,
        price: row.price,
        mesh,
        isReady: true,
        isWatered: row.isWatered,
        popAnim: 1
      };
      cropGrid.set(row.key, crop);
      replaceMeshWithFullPlant(crop);
    } else {
      const mesh = createSeedMesh(row.type);
      mesh.position.set(x, 0.2, z);
      const progress = row.growTime > 0 ? Math.min(1, row.timer / row.growTime) : 0;
      const baseScale = 0.2 + progress * 0.8;
      mesh.scale.setScalar(baseScale);
      parent.add(mesh);
      const c: any = {
        type: row.type,
        timer: row.timer,
        growTime: row.growTime,
        price: row.price,
        mesh,
        isReady: false,
        isWatered: row.isWatered,
        popAnim: 1.0
      };
      cropGrid.set(row.key, c);
      ensureCropBar(c, false);
    }
  }
}

function writePersistedState(params: {
  panX: number;
  panZ: number;
  playerX: number;
  playerZ: number;
  playerRotY: number;
}) {
  writeSaveToLocalStorage(
    buildGameSave({
      panX: params.panX,
      panZ: params.panZ,
      playerX: params.playerX,
      playerZ: params.playerZ,
      playerRotY: params.playerRotY
    })
  );
}

async function init() {
  const verEl = document.getElementById('app-version');
  if (verEl) verEl.textContent = `v${APP_VERSION}`;
  const settingsVer = document.getElementById('settings-version');
  if (settingsVer) settingsVer.textContent = `v${APP_VERSION}`;

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
  
  const areaRoot = new THREE.Group();
  scene.add(areaRoot);
  worldAreas = buildAreas(STATE.tileSize, STATE.gridUnits);
  AREA_TRAVEL_ORDER.forEach((areaId) => {
    const area = worldAreas![areaId];
    area.root.visible = false;
    areaRoot.add(area.root);
  });
  
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

  const setArea = (areaId: AreaId, options?: { preservePlayerPosition?: boolean; silent?: boolean }) => {
    if (!worldAreas) return;
    AREA_TRAVEL_ORDER.forEach((id) => {
      worldAreas![id].root.visible = id === areaId;
    });

    activeArea = worldAreas[areaId];
    STATE.currentArea = areaId;
    updateTravelUi(areaId);

    setWorldBoundsForMap(activeArea.mapHalfSize, 1.1);
    edgeBlockers.length = 0;
    edgeBlockers.push(...activeArea.edgeBlockers);

    if (!options?.preservePlayerPosition) {
      playerMesh.position.set(activeArea.spawn.x, 0, activeArea.spawn.z);
      playerMesh.rotation.y = activeArea.spawn.rotY;
      cameraPan.set(0, 0, 0);
    }

    if (!options?.silent) {
      showToast(AREA_TRAVEL_BLURBS[areaId], 'info');
    }
  };

  updateTravelUi(STATE.currentArea);
  document.getElementById('travel-btn')?.addEventListener('click', () => {
    playSound('click');
    setArea(getNextAreaId(STATE.currentArea));
  });

  const loadResult = readSaveFromLocalStorage();
  if (loadResult) {
    const base = makeEmptySaveV1();
    const data: GameSaveV1 = {
      ...base,
      ...loadResult,
      crops: loadResult.crops ?? [],
      inventoryQty:
        loadResult.inventoryQty && loadResult.inventoryQty.length >= 4
          ? loadResult.inventoryQty
          : base.inventoryQty
    };
    applySaveToState(data);
    playerMesh.position.set(
      typeof data.playerX === 'number' ? data.playerX : 0,
      0,
      typeof data.playerZ === 'number' ? data.playerZ : 2
    );
    playerMesh.rotation.y = typeof data.playerRotY === 'number' ? data.playerRotY : 0;
    cameraPan.set(
      typeof data.panX === 'number' ? data.panX : 0,
      0,
      typeof data.panZ === 'number' ? data.panZ : 0
    );
    rehydrateCropsFromSave(worldAreas!.farmstead.cropRoot, data.crops);
    selectSlot(STATE.activeSlot);
    setArea(STATE.currentArea, { preservePlayerPosition: true, silent: true });
  } else {
    setArea(STATE.currentArea, { preservePlayerPosition: false, silent: true });
    selectSlot(STATE.activeSlot);
  }

  let lastAutoSave = performance.now();
  window.addEventListener('beforeunload', () => {
    writePersistedState({
      panX: cameraPan.x,
      panZ: cameraPan.z,
      playerX: playerMesh.position.x,
      playerZ: playerMesh.position.z,
      playerRotY: playerMesh.rotation.y
    });
  });

  document.getElementById('open-data-btn')?.addEventListener('click', () => {
    if (shopOpen) toggleShop();
    if (inventoryOpen) setInventoryOpen(false);
    setDataModalOpen(true);
  });

  document.getElementById('pause-resume-btn')?.addEventListener('click', () => {
    playSound('click');
    setPauseMenuOpen(false);
  });
  document.getElementById('pause-settings-btn')?.addEventListener('click', () => {
    playSound('click');
    setPauseSettingsView('settings');
  });
  document.getElementById('pause-back-btn')?.addEventListener('click', () => {
    playSound('click');
    setPauseSettingsView('main');
  });
  document.getElementById('pause-quit-btn')?.addEventListener('click', () => {
    playSound('click');
    if (!confirm('Leave the game? You can close the tab or try to exit the window.')) return;
    try {
      window.open('', '_self');
      window.close();
    } catch { /* pass */ }
    setTimeout(() => {
      showToast('Close the browser tab to exit, or return with Resume.', 'info');
    }, 200);
  });
  document.getElementById('close-inventory')?.addEventListener('click', () => {
    setInventoryOpen(false);
    playSound('click');
  });
  document.getElementById('close-data')?.addEventListener('click', () => setDataModalOpen(false));
  document.getElementById('export-save-btn')?.addEventListener('click', () => {
    const json = JSON.stringify(
      buildGameSave({
        panX: cameraPan.x,
        panZ: cameraPan.z,
        playerX: playerMesh.position.x,
        playerZ: playerMesh.position.z,
        playerRotY: playerMesh.rotation.y
      }),
      null,
      2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'garden3d_save.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Save file downloaded.', 'success');
  });
  const importInput = document.getElementById('import-save-file') as HTMLInputElement | null;
  importInput?.addEventListener('change', () => {
    const f = importInput.files?.[0];
    if (!f) return;
    void f.text().then(t => {
      const merged = mergeImportedJson(t);
      if (!merged) {
        showToast('Invalid or incompatible save file.', 'warning');
        importInput.value = '';
        return;
      }
      writeSaveToLocalStorage(merged);
      showToast('Save imported. Reloading…', 'info');
      setTimeout(() => location.reload(), 450);
    });
  });
  document.getElementById('reset-farm-btn')?.addEventListener('click', () => {
    if (!confirm('Reset the farm? This deletes your local save and reloads. This cannot be undone.')) {
      return;
    }
    clearSaveStorageOnly();
    showToast('Save cleared. Reloading…', 'info');
    setTimeout(() => location.reload(), 300);
  });
  
  // Game Loop Variables
  let lastTime = performance.now();
  let spacePressedLast = false;
  let talkPressedLast = false;
  
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (isWorldPaused()) {
      updateUI();
      renderer.render(scene, camera);
      return;
    }
    
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
    npcManager.update(dt, now, {
      playerPos: playerMesh.position,
      onBark: (line) => showToast(line, 'info'),
      gameTime: STATE.gameTime
    });
    
    updatePlayerMovement(
      playerMesh,
      camera,
      { w: keys.w, a: keys.a, s: keys.s, d: keys.d, shift: keys.shift },
      inputBlockedForMoveAndWheel(),
      edgeBlockers,
      { leftArm, rightArm, leftLeg, rightLeg },
      dt,
      now,
      audioCtx
    );
    
    // Determine Grid Snapping via Mouse Raycast
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    const gridX = Math.round(intersectPoint.x / STATE.tileSize) * STATE.tileSize;
    const gridZ = Math.round(intersectPoint.z / STATE.tileSize) * STATE.tileSize;
    
    let lastTileKey = "";
    lastTileKey = `${gridX},${gridZ}`;
    const npcPrompt = npcManager.getInteractionPrompt(playerMesh.position);
    if (npcPrompt) {
      const hintEl = document.getElementById('interaction-hint');
      if (hintEl) hintEl.textContent = npcPrompt;
    } else {
      updateInteractionHint(lastTileKey);
    }

    highlightMesh.position.set(gridX, 0.1, gridZ);

    if (mouseInteractionRequested) {
      handleInteraction(gridX, gridZ, worldAreas!.farmstead.cropRoot);
      mouseInteractionRequested = false;
    }
    
    // Interaction System (Spacebar)
    if (keys.space && !spacePressedLast) {
      handleInteraction(gridX, gridZ, worldAreas!.farmstead.cropRoot);
    }
    spacePressedLast = keys.space;
    if (keys.f && !talkPressedLast && !inputBlockedForCanvas()) {
      npcManager.interactNearest(playerMesh.position, STATE.gameTime, now, (line) => showToast(line, 'info'));
    }
    talkPressedLast = keys.f;
    
    // Crop Update Loop
    updateCrops(dt);
    updateAllCropBars3D(cropGrid, camera, now);
    updatePlantPanel(lastTileKey);

    const hlMat = highlightMesh.material as THREE.LineBasicMaterial;
    if (!activeArea?.allowsFarming) {
      hlMat.color.setHex(0x90a4ae);
    } else if (cropGrid.has(lastTileKey)) {
      const hc = cropGrid.get(lastTileKey) as { isReady: boolean; isWatered: boolean };
      if (hc.isReady) hlMat.color.setHex(0x66bb6a);
      else if (!hc.isWatered) hlMat.color.setHex(0xffb74d);
      else hlMat.color.setHex(0xffee58);
    } else if (!isFarmPlotTile(lastTileKey)) {
      hlMat.color.setHex(0x8d6e63);
    } else {
      hlMat.color.setHex(0xffff00);
    }

    updateFollowCamera(
      camera,
      playerMesh.position,
      cameraPan,
      {
        arrowup: keys.arrowup,
        arrowdown: keys.arrowdown,
        arrowleft: keys.arrowleft,
        arrowright: keys.arrowright
      },
      dt,
      STATE.cameraZoom
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
    
    // UI: FF Button Visibility
    const ffBtn = document.getElementById('ff-btn');
    if (ffBtn) {
      if (hour > 20 || hour < 5) ffBtn.classList.remove('hidden');
      else ffBtn.classList.add('hidden');
    }

    // Auto-switch Harvest tool logic
    if (activeArea?.allowsFarming && cropGrid.has(lastTileKey)) {
        const crop = cropGrid.get(lastTileKey);
        if (crop.isReady) {
            document.querySelector(`.slot[data-slot="${HARVEST_SLOT_INDEX}"]`)?.classList.add('active-tip');
            if (STATE.activeSlot !== HARVEST_SLOT_INDEX) {
                const autoNow = performance.now();
                if (!crop.lastAutoSwitch || autoNow - crop.lastAutoSwitch > 2000) {
                     selectSlot(HARVEST_SLOT_INDEX);
                     crop.lastAutoSwitch = autoNow;
                }
            }
        } else {
            document.querySelector(`.slot[data-slot="${HARVEST_SLOT_INDEX}"]`)?.classList.remove('active-tip');
        }
    } else {
        document.querySelector(`.slot[data-slot="${HARVEST_SLOT_INDEX}"]`)?.classList.remove('active-tip');
    }

    if (now - lastAutoSave > 20000) {
      lastAutoSave = now;
      writePersistedState({
        panX: cameraPan.x,
        panZ: cameraPan.z,
        playerX: playerMesh.position.x,
        playerZ: playerMesh.position.z,
        playerRotY: playerMesh.rotation.y
      });
    }

    updateUI();
    renderer.render(scene, camera);
  });
}

// --- FARMING LOGIC ---
function handleInteraction(x: number, z: number, cropParent: THREE.Object3D) {
  const tileKey = `${x},${z}`;
  const slotData = STATE.inventory[STATE.activeSlot];

  if (!activeArea?.allowsFarming) {
    showToast(`${activeArea?.label ?? 'This area'} is for scouting. Travel back to the farm to plant.`, 'info');
    return;
  }

  if (slotData.type === 'harvest') {
    // Attempt harvest
    if (cropGrid.has(tileKey)) {
      const crop = cropGrid.get(tileKey);
      if (crop.isReady) {
        removeCropBar(crop);
        crop.mesh.removeFromParent();
        cropGrid.delete(tileKey);
        
        const payout = crop.price;
        STATE.gold += payout;
        devCountHarvest();
        showToast(`Harvested ${crop.type}! <b>+${payout} G</b>`, 'success');
        document.querySelector('.wallet-panel')?.classList.add('bump');
        setTimeout(() => document.querySelector('.wallet-panel')?.classList.remove('bump'), 200);
      } else {
        showToast(`Not ready to harvest yet.`, 'info');
      }
    }
  } else if (slotData.type === 'water') {
    // Well refill check
    const wellPos = activeArea?.wellPos;
    if (!playerMeshRef) return;
    const distToWell = wellPos ? playerMeshRef.position.distanceTo(wellPos) : Infinity;

    if (wellPos && distToWell < 2.5) {
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
            devCountWater();
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
        if (!isWithinFarmPlot(x, z)) {
          triggerErrorSlot();
          showToast('Plant inside the farm beds. The old free-for-all field layout is gone.', 'warning');
          return;
        }
        slotData.qty -= 1;
        
        const mesh = createSeedMesh(slotData.type);
        mesh.position.set(x, 0.2, z);
        mesh.scale.setScalar(0.1); 
        cropParent.add(mesh);
        
        const newCrop: any = {
          type: slotData.type,
          timer: 0,
          growTime: slotData.growTime,
          price: slotData.price,
          mesh: mesh,
          isReady: false,
          isWatered: false,
          popAnim: 0
        };
        cropGrid.set(tileKey, newCrop);
        ensureCropBar(newCrop, false);
        devCountPlant();
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

function createSeedMesh(plantType: string) {
  const geo = new THREE.SphereGeometry(0.2, 8, 8);
  const colors: Record<string, number> = {
    carrot: 0x8d5524,
    flower: 0xce93d8,
    tomato: 0xc62828
  };
  const mat = new THREE.MeshStandardNodeMaterial({ color: colors[plantType] ?? 0x8d5524 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function replaceMeshWithFullPlant(crop: any) {
  const pos = crop.mesh.position.clone();
  const oldMesh = crop.mesh;
  const parent = oldMesh.parent;
  const bar = crop.progressBar3d;
  if (bar) {
    bar.root.removeFromParent();
  }
  if (parent) {
    parent.remove(oldMesh);
  }

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
  } else if (crop.type === 'tomato') {
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.5);
    const stemMat = new THREE.MeshStandardNodeMaterial({ color: 0x33691e });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.3;
    group.add(stem);
    const fruitMat = new THREE.MeshStandardNodeMaterial({ color: 0xd32f2f });
    for (let i = 0; i < 3; i++) {
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), fruitMat);
      const a = (i / 3) * Math.PI * 2;
      fruit.position.set(Math.cos(a) * 0.22, 0.55 + i * 0.06, Math.sin(a) * 0.22);
      fruit.castShadow = true;
      group.add(fruit);
    }
  }
  
  window.dispatchEvent(new Event('resize'));
  if (parent) {
    parent.add(group);
  }
  crop.mesh = group;
  if (bar) {
    group.add(bar.root);
    bar.root.position.set(0, getBarYLocal(true, crop.type), 0);
  } else {
    ensureCropBar(crop, true);
  }
}

init().then(() => {
  setTimeout(showChangelogModal, 1500);
}).catch(console.error);

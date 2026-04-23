import { AREA_IDS } from '../config/areaConfig';
import { HOTBAR_SLOT_COUNT } from '../config/gameConstants';
import { cropGrid, STATE } from '../state/gameState';
import { makeEmptySaveV1, SAVE_FORMAT_VERSION, SAVE_STORAGE_KEY, type GameSaveV1 } from './saveFormat';
import { devCountSave } from '../dev/devCounters';

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}

function isAreaId(x: unknown): x is GameSaveV1['currentArea'] {
  return typeof x === 'string' && AREA_IDS.includes(x as GameSaveV1['currentArea']);
}

export function parseSaveV1(json: string): GameSaveV1 | null {
  try {
    const o = JSON.parse(json) as unknown;
    if (!isRecord(o) || o.v !== SAVE_FORMAT_VERSION) return null;
    if (typeof o.day !== 'number' || typeof o.gameTime !== 'number' || typeof o.gold !== 'number') {
      return null;
    }
    if (typeof o.currentArea !== 'undefined' && !isAreaId(o.currentArea)) return null;
    if (!Array.isArray(o.crops) || !Array.isArray(o.inventoryQty)) return null;
    return o as GameSaveV1;
  } catch {
    return null;
  }
}

/**
 * Build a JSON snapshot from current `STATE` and `cropGrid` (no scene meshes in JSON).
 */
export function buildGameSave(params: {
  panX: number;
  panZ: number;
  playerX: number;
  playerZ: number;
  playerRotY: number;
}): GameSaveV1 {
  const inventoryQty: number[] = [];
  for (let i = 0; i < STATE.inventory.length; i++) {
    const q = STATE.inventory[i].qty;
    inventoryQty.push(Number.isFinite(q) ? (q as number) : 0);
  }
  const crops: GameSaveV1['crops'] = [];
  cropGrid.forEach((c, key) => {
    crops.push({
      key,
      type: c.type,
      timer: c.timer,
      growTime: c.growTime,
      isReady: !!c.isReady,
      isWatered: !!c.isWatered,
      price: c.price,
      popAnim: typeof c.popAnim === 'number' ? c.popAnim : 0
    });
  });
  return {
    v: SAVE_FORMAT_VERSION,
    day: STATE.day,
    gameTime: STATE.gameTime,
    gold: STATE.gold,
    activeSlot: Math.min(STATE.activeSlot, HOTBAR_SLOT_COUNT - 1),
    cameraZoom: STATE.cameraZoom,
    currentArea: STATE.currentArea,
    panX: params.panX,
    panZ: params.panZ,
    playerX: params.playerX,
    playerZ: params.playerZ,
    playerRotY: params.playerRotY,
    inventoryQty,
    crops
  };
}

/** Overwrites `STATE` from a save. Does not touch `cropGrid` or the scene. */
export function applySaveToState(data: GameSaveV1): void {
  STATE.day = data.day;
  STATE.gameTime = data.gameTime;
  STATE.gold = data.gold;
  STATE.activeSlot = Math.max(0, Math.min(HOTBAR_SLOT_COUNT - 1, data.activeSlot | 0));
  STATE.cameraZoom = Math.max(0.5, Math.min(2, data.cameraZoom));
  STATE.currentArea = isAreaId(data.currentArea) ? data.currentArea : 'farmstead';
  for (let i = 0; i < STATE.inventory.length; i++) {
    const inv = STATE.inventory[i];
    if (inv.type === 'harvest') continue;
    const nq = data.inventoryQty[i];
    if (typeof nq !== 'number' || nq < 0) continue;
    if (inv.type === 'water') {
      const max = inv.maxQty ?? 10;
      inv.qty = Math.min(max, nq);
    } else {
      inv.qty = nq;
    }
  }
}

export function readSaveFromLocalStorage(): GameSaveV1 | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SAVE_STORAGE_KEY);
  if (!raw) return null;
  return parseSaveV1(raw);
}

export function writeSaveToLocalStorage(data: GameSaveV1): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
    devCountSave();
  } catch (e) {
    console.warn('[persistence] save failed', e);
  }
}

/** Merge a parsed save with `makeEmptySaveV1()` so partial hand-edited JSON can still load. */
export function mergeImportedJson(json: string): GameSaveV1 | null {
  const parsed = parseSaveV1(json);
  if (!parsed) return null;
  const base = makeEmptySaveV1();
  return {
    ...base,
    ...parsed,
    v: SAVE_FORMAT_VERSION,
    crops: Array.isArray(parsed.crops) ? parsed.crops : [],
    inventoryQty: parsed.inventoryQty && parsed.inventoryQty.length >= 4 ? parsed.inventoryQty : base.inventoryQty
  };
}

export function clearSaveStorageOnly(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch (e) {
    console.warn('[persistence] clear save failed', e);
  }
}

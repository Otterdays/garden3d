import type { AreaId } from '../config/areaConfig';

// Central mutable game state (imported by `main.ts` and future systems).
// Hotbar order matches `index.html`: carrot, flower, tomato, water, harvest.

export const STATE = {
  gold: 50,
  activeSlot: 0,
  inventory: [
    { type: 'carrot' as const, qty: 5, price: 10, growTime: 5 },
    { type: 'flower' as const, qty: 5, price: 25, growTime: 10 },
    { type: 'tomato' as const, qty: 3, price: 40, growTime: 7 },
    { type: 'water' as const, qty: 10, maxQty: 10, price: 0, growTime: 0 },
    { type: 'harvest' as const, qty: Infinity, price: 0, growTime: 0 }
  ],
  day: 1,
  gameTime: 8 * 60,
  timeScale: 0.12,
  tileSize: 1.5,
  gridUnits: 16,
  cameraZoom: 1.0,
  currentArea: 'farmstead' as AreaId
};

// Crop instances on the grid: key = "x,z" world tile
export const cropGrid = new Map<string, any>();

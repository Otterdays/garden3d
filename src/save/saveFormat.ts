import type { AreaId } from '../config/areaConfig';

/**
 * Save/load snapshot version field — bump when fields change; loaders may migrate older `v`.
 * Persisted by `persistence.ts` (localStorage); optional export to file can reuse the same JSON.
 */
export const SAVE_FORMAT_VERSION = 1 as const;

export const SAVE_STORAGE_KEY = 'garden3d_save_v1';

export type SavedCropV1 = {
  key: string;
  type: string;
  timer: number;
  growTime: number;
  isReady: boolean;
  isWatered: boolean;
  price: number;
  popAnim: number;
};

export type GameSaveV1 = {
  v: typeof SAVE_FORMAT_VERSION;
  day: number;
  gameTime: number;
  gold: number;
  activeSlot: number;
  cameraZoom: number;
  currentArea: AreaId;
  panX: number;
  panZ: number;
  playerX: number;
  playerZ: number;
  playerRotY: number;
  /** One entry per `STATE.inventory` row (carrot, flower, tomato, water); harvest is not stored. */
  inventoryQty: number[];
  crops: SavedCropV1[];
};

export function makeEmptySaveV1(): GameSaveV1 {
  return {
    v: SAVE_FORMAT_VERSION,
    day: 1,
    gameTime: 8 * 60,
    gold: 50,
    activeSlot: 0,
    cameraZoom: 1.0,
    currentArea: 'farmstead',
    panX: 0,
    panZ: 0,
    playerX: 0,
    playerZ: 2,
    playerRotY: 0,
    inventoryQty: [5, 5, 3, 10],
    crops: []
  };
}

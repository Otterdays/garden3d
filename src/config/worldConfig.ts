/**
 * World bounds and mutable boundary state (clamped in `src/systems/playerMovement.ts` after map size is known).
 */
export const worldBounds = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };

export function setWorldBoundsForMap(mapHalfSize: number, inset = 1): void {
  worldBounds.minX = -mapHalfSize + inset;
  worldBounds.maxX = mapHalfSize - inset;
  worldBounds.minZ = -mapHalfSize + inset;
  worldBounds.maxZ = mapHalfSize - inset;
}

export type EdgeBlocker = { x: number; z: number; radius: number };

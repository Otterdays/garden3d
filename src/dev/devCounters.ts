/**
 * Development-only action counters (import.meta.env.DEV). Exposed as `window.__garden3dStats` in dev.
 */
export const devCounters = {
  plants: 0,
  harvests: 0,
  waters: 0,
  saveWrites: 0
};

if (import.meta.env.DEV) {
  (window as unknown as { __garden3dStats: typeof devCounters }).__garden3dStats = devCounters;
}

export function devCountPlant(): void {
  if (import.meta.env.DEV) devCounters.plants += 1;
}
export function devCountHarvest(): void {
  if (import.meta.env.DEV) devCounters.harvests += 1;
}
export function devCountWater(): void {
  if (import.meta.env.DEV) devCounters.waters += 1;
}
export function devCountSave(): void {
  if (import.meta.env.DEV) devCounters.saveWrites += 1;
}

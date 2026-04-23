export const AREA_IDS = ['farmstead', 'ironwoodReach'] as const;

export type AreaId = (typeof AREA_IDS)[number];

export const AREA_LABELS: Record<AreaId, string> = {
  farmstead: 'Farmstead',
  ironwoodReach: 'Ironwood Reach'
};

export const AREA_TRAVEL_ORDER: AreaId[] = ['farmstead', 'ironwoodReach'];

export const AREA_TRAVEL_BLURBS: Record<AreaId, string> = {
  farmstead: 'Back to the land that actually grows things.',
  ironwoodReach: 'Into the reach. Finally, a place with some attitude.'
};

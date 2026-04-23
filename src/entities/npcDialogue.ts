type TownPoi = {
  label: string;
  x: number;
  z: number;
};

const MORNING_LINES = [
  'Morning air like this makes the farm feel lucky.',
  'Best time to water is before the heat really wakes up.',
  'Everything feels calmer before the market gets noisy.'
];

const DAY_LINES = [
  'The town feels busiest once the sun gets high.',
  'I keep thinking about what to plant next season.',
  'A slow day in town still beats a rushed one.'
];

const EVENING_LINES = [
  'Evening light makes the whole valley look softer.',
  'I like how the lanterns wake up after sunset.',
  'Feels like the town finally exhales at this hour.'
];

const POI_LINES: Record<string, string[]> = {
  market: [
    'The market stall always pulls people in by the afternoon.',
    'I keep checking the stall even when I do not need seeds.',
    'Prices feel fair today, which is rare enough to notice.'
  ],
  well: [
    'The well saves half the harvest on dry days.',
    'You can tell who forgot to water by how fast they rush to the well.',
    'Fresh water makes the whole farm feel more alive.'
  ],
  campfire: [
    'The campfire makes late nights feel less lonely.',
    'I end up drifting back to the fire whenever the air cools off.',
    'That fire is the best place in town to slow down for a minute.'
  ],
  farm: [
    'Your field is starting to look properly lived in.',
    'The farm always looks better after someone spends real time with it.',
    'There is a good rhythm to this patch when everything is watered.'
  ]
};

const WARM_LINES = [
  'Good to see you again.',
  'I was hoping I would run into you.',
  'Nice to catch up for a minute.'
];

function pickRandom(lines: string[]) {
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getNearbyPoiLabel(
  pos: { x: number; z: number },
  pois: TownPoi[],
  maxDist = 2.6
): string | null {
  let bestDist = Infinity;
  let label: string | null = null;
  for (const poi of pois) {
    const dx = poi.x - pos.x;
    const dz = poi.z - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < bestDist && dist <= maxDist) {
      bestDist = dist;
      label = poi.label;
    }
  }
  return label;
}

export function buildNpcTalkLine(params: {
  name: string;
  affinity: number;
  gameTime: number;
  poiLabel: string | null;
}) {
  const { name, affinity, gameTime, poiLabel } = params;
  const hour = gameTime / 60;

  let base = pickRandom(DAY_LINES);
  if (hour < 11) base = pickRandom(MORNING_LINES);
  else if (hour >= 17) base = pickRandom(EVENING_LINES);

  if (poiLabel && POI_LINES[poiLabel]) {
    base = pickRandom(POI_LINES[poiLabel]);
  }

  if (affinity >= 2) {
    return `${name} smiles. "${pickRandom(WARM_LINES)} ${base}"`;
  }

  return `${name} says, "${base}"`;
}

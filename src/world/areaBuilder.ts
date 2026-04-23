import * as THREE from 'three/webgpu';
import { AREA_LABELS, type AreaId } from '../config/areaConfig';
import type { EdgeBlocker } from '../config/worldConfig';

type AreaSpawn = { x: number; z: number; rotY: number };
type FarmBounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export type BuiltArea = {
  id: AreaId;
  label: string;
  root: THREE.Group;
  cropRoot: THREE.Group;
  mapHalfSize: number;
  spawn: AreaSpawn;
  edgeBlockers: EdgeBlocker[];
  allowsFarming: boolean;
  farmBounds?: FarmBounds;
  marketPos?: THREE.Vector3;
  wellPos?: THREE.Vector3;
};

function makeTree(
  woodMat: THREE.Material,
  leafMat: THREE.Material,
  scale = 1
): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.1, 6), woodMat);
  trunk.position.y = 0.55 * scale;
  trunk.scale.setScalar(scale);
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.8, 6), leafMat);
  leaves.position.y = 2.2 * scale;
  leaves.scale.setScalar(scale);
  leaves.castShadow = true;
  tree.add(trunk);
  tree.add(leaves);
  return tree;
}

function addLantern(root: THREE.Group, x: number, z: number, woodMat: THREE.Material) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 6), woodMat);
  post.position.set(x, 0.9, z);
  post.castShadow = true;
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 6),
    new THREE.MeshStandardNodeMaterial({ color: 0xffd76a, roughness: 0.25, metalness: 0.1 })
  );
  lamp.position.set(x, 1.62, z);
  root.add(post);
  root.add(lamp);
}

function addOuterRingTrees(
  root: THREE.Group,
  radiusMin: number,
  radiusMax: number,
  count: number,
  woodMat: THREE.Material,
  leafA: THREE.Material,
  leafB: THREE.Material
) {
  for (let i = 0; i < count; i++) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
    const theta = Math.random() * Math.PI * 2;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const tree = makeTree(woodMat, Math.random() > 0.4 ? leafA : leafB, 0.75 + Math.random() * 0.7);
    tree.position.set(x, 0, z);
    root.add(tree);
  }
}

function addOrganicBlockers(
  root: THREE.Group,
  radius: number,
  count: number,
  hedgeMat: THREE.Material,
  rockMat: THREE.Material
): EdgeBlocker[] {
  const blockers: EdgeBlocker[] = [];
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 1.1;
    const x = Math.cos(theta) * (radius + jitter);
    const z = Math.sin(theta) * (radius + jitter);
    const blockerRadius = 0.7 + Math.random() * 0.35;

    if (Math.random() > 0.32) {
      const hedge = new THREE.Mesh(
        new THREE.SphereGeometry(0.55 + Math.random() * 0.28, 8, 6),
        hedgeMat
      );
      hedge.position.set(x, 0.35, z);
      hedge.scale.y = 0.7 + Math.random() * 0.25;
      hedge.castShadow = true;
      hedge.receiveShadow = true;
      root.add(hedge);
    } else {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.22, 0),
        rockMat
      );
      rock.position.set(x, 0.18, z);
      rock.scale.y = 0.6 + Math.random() * 0.45;
      rock.castShadow = true;
      rock.receiveShadow = true;
      root.add(rock);
    }

    blockers.push({ x, z, radius: blockerRadius });
  }
  return blockers;
}

function addFarmsteadPerimeter(
  root: THREE.Group,
  mapSize: number,
  mapHalfSize: number,
  stoneMat: THREE.Material,
  accentMat: THREE.Material,
  woodMat: THREE.Material
) {
  const wallHeight = 1.4;
  const wallThickness = 0.8;
  const inset = 0.4;
  const span = mapSize - 1.2;
  const walls = [
    new THREE.Mesh(new THREE.BoxGeometry(span, wallHeight, wallThickness), stoneMat),
    new THREE.Mesh(new THREE.BoxGeometry(span, wallHeight, wallThickness), stoneMat),
    new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, span), stoneMat),
    new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, span), stoneMat)
  ];
  walls[0].position.set(0, wallHeight * 0.5, -mapHalfSize + inset);
  walls[1].position.set(0, wallHeight * 0.5, mapHalfSize - inset);
  walls[2].position.set(-mapHalfSize + inset, wallHeight * 0.5, 0);
  walls[3].position.set(mapHalfSize - inset, wallHeight * 0.5, 0);
  walls.forEach((wall) => {
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);
  });

  const towerGeo = new THREE.CylinderGeometry(1.1, 1.25, 2.8, 8);
  const capGeo = new THREE.ConeGeometry(1.15, 1.05, 8);
  const towerPositions = [
    [-mapHalfSize + 1.6, -mapHalfSize + 1.6],
    [mapHalfSize - 1.6, -mapHalfSize + 1.6],
    [-mapHalfSize + 1.6, mapHalfSize - 1.6],
    [mapHalfSize - 1.6, mapHalfSize - 1.6]
  ];
  for (const [x, z] of towerPositions) {
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.set(x, 1.4, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    const roof = new THREE.Mesh(capGeo, accentMat);
    roof.position.set(x, 3.25, z);
    roof.castShadow = true;
    root.add(tower);
    root.add(roof);
  }

  const gate = new THREE.Group();
  gate.position.set(0, 0, mapHalfSize - inset);
  const sideGeo = new THREE.BoxGeometry(0.6, 2.2, 1.1);
  const leftSide = new THREE.Mesh(sideGeo, stoneMat);
  leftSide.position.set(-1.5, 1.1, 0);
  const rightSide = new THREE.Mesh(sideGeo, stoneMat);
  rightSide.position.set(1.5, 1.1, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 1.1), accentMat);
  lintel.position.set(0, 2.1, 0);
  const doors = [
    new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.12), woodMat),
    new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.12), woodMat)
  ];
  doors[0].position.set(-0.72, 0.72, 0.02);
  doors[0].rotation.y = Math.PI * 0.14;
  doors[1].position.set(0.72, 0.72, 0.02);
  doors[1].rotation.y = -Math.PI * 0.14;
  gate.add(leftSide, rightSide, lintel, ...doors);
  root.add(gate);

  for (let i = -2; i <= 2; i++) {
    addLantern(root, i * (mapSize * 0.19), -mapHalfSize + 1.2, woodMat);
    if (i !== 0) addLantern(root, i * (mapSize * 0.19), mapHalfSize - 1.2, woodMat);
  }
}

function buildFarmstead(tileSize: number, gridUnits: number): BuiltArea {
  const root = new THREE.Group();
  const cropRoot = new THREE.Group();
  root.add(cropRoot);

  const mapSize = gridUnits * tileSize;
  const mapHalfSize = mapSize * 0.5;

  const ground = new THREE.Mesh(
    (() => {
      const geo = new THREE.PlaneGeometry(mapSize, mapSize);
      geo.rotateX(-Math.PI / 2);
      return geo;
    })(),
    new THREE.MeshStandardNodeMaterial({ color: 0x345f28, roughness: 0.92 })
  );
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  root.add(ground);

  const stoneMat = new THREE.MeshStandardNodeMaterial({ color: 0x8a8176, roughness: 0.95 });
  const warmStoneMat = new THREE.MeshStandardNodeMaterial({ color: 0xb0a89b, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardNodeMaterial({ color: 0x6d4c41, roughness: 0.9 });
  const darkWoodMat = new THREE.MeshStandardNodeMaterial({ color: 0x3e2723, roughness: 0.98 });
  const leafGreenMat = new THREE.MeshStandardNodeMaterial({ color: 0x245b2f, roughness: 0.82 });
  const lightLeafMat = new THREE.MeshStandardNodeMaterial({ color: 0x377c40, roughness: 0.82 });
  const waterMat = new THREE.MeshStandardNodeMaterial({ color: 0x1b6dc1, roughness: 0.24, metalness: 0.32 });
  const dirtPathMat = new THREE.MeshStandardNodeMaterial({ color: 0x6f4d2b, roughness: 1.0 });
  const soilMat = new THREE.MeshStandardNodeMaterial({ color: 0x4b2b17, roughness: 1.0 });
  const hedgeMat = new THREE.MeshStandardNodeMaterial({ color: 0x2f7a35, roughness: 0.92 });
  const rockMat = new THREE.MeshStandardNodeMaterial({ color: 0x737373, roughness: 0.95 });

  addFarmsteadPerimeter(root, mapSize, mapHalfSize, stoneMat, warmStoneMat, woodMat);

  const road = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 12), dirtPathMat);
  road.position.set(0, 0, 2.5);
  road.receiveShadow = true;
  root.add(road);
  const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(13, 0.06, 1.5), dirtPathMat);
  crossRoad.position.set(0, 0.01, -5.5);
  crossRoad.receiveShadow = true;
  root.add(crossRoad);

  const houseGroup = new THREE.Group();
  houseGroup.position.set(-5.3, 0, -3.9);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.1, 4.2), warmStoneMat);
  walls.position.y = 1.55;
  walls.castShadow = true;
  walls.receiveShadow = true;
  const roofGeo = new THREE.ConeGeometry(3.6, 2.2, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(
    roofGeo,
    new THREE.MeshStandardNodeMaterial({ color: 0x7c342e, roughness: 0.92 })
  );
  roof.position.y = 4.2;
  roof.castShadow = true;
  const porch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 1.4), woodMat);
  porch.position.set(0, 0.08, 2.5);
  porch.receiveShadow = true;
  houseGroup.add(walls, roof, porch);
  root.add(houseGroup);

  const plotWidth = tileSize * 6;
  const plotDepth = tileSize * 4;
  const plotCenter = new THREE.Vector3(3.2, 0, 2.1);
  const plotMesh = new THREE.Mesh(new THREE.BoxGeometry(plotWidth, 0.18, plotDepth), soilMat);
  plotMesh.position.copy(plotCenter);
  plotMesh.position.y = 0.02;
  plotMesh.receiveShadow = true;
  root.add(plotMesh);

  const retainingMat = new THREE.MeshStandardNodeMaterial({ color: 0x70533c, roughness: 0.95 });
  const borders = [
    new THREE.Mesh(new THREE.BoxGeometry(plotWidth + 0.7, 0.28, 0.35), retainingMat),
    new THREE.Mesh(new THREE.BoxGeometry(plotWidth + 0.7, 0.28, 0.35), retainingMat),
    new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, plotDepth + 0.7), retainingMat),
    new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, plotDepth + 0.7), retainingMat)
  ];
  borders[0].position.set(plotCenter.x, 0.1, plotCenter.z - plotDepth * 0.5 - 0.18);
  borders[1].position.set(plotCenter.x, 0.1, plotCenter.z + plotDepth * 0.5 + 0.18);
  borders[2].position.set(plotCenter.x - plotWidth * 0.5 - 0.18, 0.1, plotCenter.z);
  borders[3].position.set(plotCenter.x + plotWidth * 0.5 + 0.18, 0.1, plotCenter.z);
  borders.forEach((border) => {
    border.castShadow = true;
    border.receiveShadow = true;
    root.add(border);
  });

  const fenceMat = new THREE.MeshStandardNodeMaterial({ color: 0x6b4f34, roughness: 0.95 });
  for (let i = -3; i <= 3; i++) {
    const fence = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.16), fenceMat);
    fence.position.set(plotCenter.x + i * tileSize, 0.48, plotCenter.z - plotDepth * 0.5 - 0.75);
    fence.castShadow = true;
    root.add(fence);
    if (Math.abs(i) > 1) {
      const rear = fence.clone();
      rear.position.z = plotCenter.z + plotDepth * 0.5 + 0.75;
      root.add(rear);
    }
  }

  const scarecrow = new THREE.Group();
  scarecrow.position.set(7.3, 0, -0.1);
  const scarePost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.9, 6), woodMat);
  scarePost.position.y = 0.95;
  const scareArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), woodMat);
  scareArm.position.y = 1.45;
  const scareHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 8),
    new THREE.MeshStandardNodeMaterial({ color: 0xd7b489, roughness: 0.9 })
  );
  scareHead.position.y = 1.75;
  scarecrow.add(scarePost, scareArm, scareHead);
  root.add(scarecrow);

  const campfireRingMat = new THREE.MeshStandardNodeMaterial({ color: 0x9b948b, roughness: 0.98 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 5), campfireRingMat);
    stone.position.set(0.8 + Math.cos(angle) * 0.6, 0.1, -3.9 + Math.sin(angle) * 0.6);
    stone.scale.y = 0.65;
    root.add(stone);
  }

  const fireLogGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
  const fireLog1 = new THREE.Mesh(fireLogGeo, darkWoodMat);
  fireLog1.rotation.z = Math.PI / 2;
  fireLog1.rotation.y = Math.PI / 4;
  fireLog1.position.set(0.8, 0.18, -3.9);
  const fireLog2 = fireLog1.clone();
  fireLog2.rotation.y = -Math.PI / 4;
  root.add(fireLog1, fireLog2);

  const wellGroup = new THREE.Group();
  wellGroup.position.set(-1.8, 0, -6.2);
  const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.8, 12), stoneMat);
  wellBase.position.y = 0.4;
  wellBase.castShadow = true;
  const wellWater = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 12), waterMat);
  wellWater.position.y = 0.72;
  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6);
  const wellPost1 = new THREE.Mesh(postGeo, woodMat);
  wellPost1.position.set(-0.58, 1.22, 0);
  const wellPost2 = new THREE.Mesh(postGeo, woodMat);
  wellPost2.position.set(0.58, 1.22, 0);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.45), darkWoodMat);
  beam.position.y = 2;
  wellGroup.add(wellBase, wellWater, wellPost1, wellPost2, beam);
  root.add(wellGroup);

  const marketGroup = new THREE.Group();
  marketGroup.position.set(4.2, 0, -6.1);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 1.25), woodMat);
  counter.position.y = 0.52;
  counter.castShadow = true;
  counter.receiveShadow = true;
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(3.45, 0.08, 1.9),
    new THREE.MeshStandardNodeMaterial({ color: 0xb53a2d, roughness: 0.84 })
  );
  awning.position.set(0, 2.5, -0.22);
  awning.rotation.x = -0.13;
  awning.castShadow = true;
  marketGroup.add(counter, awning);
  [-1.45, 1.45].forEach((xOff) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.45, 6), darkWoodMat);
    post.position.set(xOff, 1.22, -0.48);
    post.castShadow = true;
    marketGroup.add(post);
  });
  [-0.85, -0.05, 0.8].forEach((xOff) => {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.42),
      new THREE.MeshStandardNodeMaterial({ color: 0x9a806a, roughness: 0.92 })
    );
    crate.position.set(xOff, 1.22, 0.03);
    crate.rotation.y = Math.random() * 0.4;
    crate.castShadow = true;
    marketGroup.add(crate);
  });
  root.add(marketGroup);

  const pond = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 0.16, 24), waterMat);
  pond.position.set(-8.1, -0.02, -9.6);
  pond.receiveShadow = true;
  root.add(pond);

  const dockMat = new THREE.MeshStandardNodeMaterial({ color: 0x5d4037, roughness: 0.95 });
  for (let i = 0; i < 6; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.24), dockMat);
    plank.position.set(-6.45, 0.08, -10.1 + i * 0.32);
    plank.castShadow = true;
    root.add(plank);
  }

  for (let i = 0; i < 14; i++) {
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 6),
      Math.random() > 0.5 ? leafGreenMat : lightLeafMat
    );
    bush.position.set(-9 + Math.random() * 18, 0.28, -1 + Math.random() * 11);
    bush.scale.set(0.7 + Math.random() * 0.5, 0.55 + Math.random() * 0.25, 0.7 + Math.random() * 0.5);
    bush.castShadow = true;
    root.add(bush);
  }

  const orchardPositions = [
    [8.4, -4.3],
    [9.6, -5.6],
    [8.2, -6.8],
    [6.9, -5.2]
  ];
  orchardPositions.forEach(([x, z], idx) => {
    const tree = makeTree(darkWoodMat, idx % 2 === 0 ? leafGreenMat : lightLeafMat, 0.85);
    tree.position.set(x, 0, z);
    root.add(tree);
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshStandardNodeMaterial({ color: 0xd64a3b, roughness: 0.55 })
    );
    fruit.position.set(x + 0.2, 2.1, z + 0.18);
    root.add(fruit);
  });

  for (let i = 0; i < 44; i++) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 4),
      new THREE.MeshStandardNodeMaterial({
        color: [0xffd54f, 0xff6e40, 0xec407a, 0x7e57c2][i % 4],
        roughness: 0.7
      })
    );
    const x = (Math.random() - 0.5) * 22;
    const z = (Math.random() - 0.5) * 22;
    if (x > -1 && x < 8.7 && z > -2 && z < 5.6) continue;
    flower.position.set(x, 0.1, z);
    root.add(flower);
  }

  addOuterRingTrees(root, 12.8, 20.5, 74, darkWoodMat, leafGreenMat, lightLeafMat);
  const edgeBlockers = addOrganicBlockers(root, mapHalfSize - 1.6, 42, hedgeMat, rockMat);

  return {
    id: 'farmstead',
    label: AREA_LABELS.farmstead,
    root,
    cropRoot,
    mapHalfSize,
    spawn: { x: 0, z: 2.4, rotY: 0 },
    edgeBlockers,
    allowsFarming: true,
    farmBounds: {
      minX: plotCenter.x - plotWidth * 0.5,
      maxX: plotCenter.x + plotWidth * 0.5,
      minZ: plotCenter.z - plotDepth * 0.5,
      maxZ: plotCenter.z + plotDepth * 0.5
    },
    marketPos: new THREE.Vector3(4.2, 0, -6.1),
    wellPos: new THREE.Vector3(-1.8, 0, -6.2)
  };
}

function buildIronwoodReach(tileSize: number, gridUnits: number): BuiltArea {
  const root = new THREE.Group();
  const cropRoot = new THREE.Group();
  root.add(cropRoot);

  const mapSize = gridUnits * tileSize;
  const mapHalfSize = mapSize * 0.5;

  const groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardNodeMaterial({ color: 0x25392d, roughness: 0.94 })
  );
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  root.add(ground);

  const stoneMat = new THREE.MeshStandardNodeMaterial({ color: 0x6d6d73, roughness: 0.98 });
  const accentMat = new THREE.MeshStandardNodeMaterial({ color: 0x4b3428, roughness: 0.95 });
  const steelMat = new THREE.MeshStandardNodeMaterial({ color: 0x607d8b, roughness: 0.45, metalness: 0.3 });
  const darkSoilMat = new THREE.MeshStandardNodeMaterial({ color: 0x413128, roughness: 1.0 });
  const mossMat = new THREE.MeshStandardNodeMaterial({ color: 0x406649, roughness: 0.88 });
  const glowWaterMat = new THREE.MeshStandardNodeMaterial({ color: 0x2979ff, roughness: 0.18, metalness: 0.42 });
  const deadWoodMat = new THREE.MeshStandardNodeMaterial({ color: 0x4e342e, roughness: 0.98 });
  const brambleMat = new THREE.MeshStandardNodeMaterial({ color: 0x36543a, roughness: 0.92 });

  const centralRoad = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 16), darkSoilMat);
  centralRoad.position.set(0, 0, 0.8);
  centralRoad.receiveShadow = true;
  root.add(centralRoad);

  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, -6.9);
  const pillarGeo = new THREE.BoxGeometry(1.2, 4.2, 1.2);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-2.3, 2.1, 0);
  leftPillar.castShadow = true;
  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(2.3, 2.1, 0);
  rightPillar.castShadow = true;
  const brokenLintel = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.65, 1.1), accentMat);
  brokenLintel.position.set(0.2, 4.1, 0);
  brokenLintel.rotation.z = -0.08;
  brokenLintel.castShadow = true;
  gateGroup.add(leftPillar, rightPillar, brokenLintel);
  root.add(gateGroup);

  const overlook = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.8, 0.55, 10), stoneMat);
  overlook.position.set(0, 0.18, 7.8);
  overlook.receiveShadow = true;
  overlook.castShadow = true;
  root.add(overlook);

  const bridgeMat = new THREE.MeshStandardNodeMaterial({ color: 0x6b5143, roughness: 0.94 });
  const ravine = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.18, 24), glowWaterMat);
  ravine.position.set(0, -0.02, 4.9);
  root.add(ravine);
  for (let i = 0; i < 7; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.3), bridgeMat);
    plank.position.set(0, 0.18, 3.4 + i * 0.46);
    plank.castShadow = true;
    root.add(plank);
  }

  const shrine = new THREE.Group();
  shrine.position.set(-6.1, 0, 1.8);
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.45, 8), stoneMat);
  dais.position.y = 0.22;
  dais.castShadow = true;
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshStandardNodeMaterial({ color: 0x80deea, roughness: 0.1, metalness: 0.2 })
  );
  crystal.position.y = 1.05;
  crystal.castShadow = true;
  shrine.add(dais, crystal);
  root.add(shrine);

  const watchDeck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 2.6), accentMat);
  watchDeck.position.set(6.4, 0.18, 2.7);
  watchDeck.castShadow = true;
  watchDeck.receiveShadow = true;
  root.add(watchDeck);
  [-1.3, 1.3].forEach((xOff) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 2.6), deadWoodMat);
    rail.position.set(6.4 + xOff, 0.68, 2.7);
    rail.castShadow = true;
    root.add(rail);
  });

  const deadTreePositions = [
    [-8.5, -4.5], [-7.2, -1.2], [8.2, -3.2], [6.3, -6.4], [8.8, 6.4], [-7.8, 7.1]
  ];
  deadTreePositions.forEach(([x, z]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.6, 6), deadWoodMat);
    trunk.position.set(x, 1.3, z);
    trunk.rotation.z = (Math.random() - 0.5) * 0.25;
    trunk.castShadow = true;
    root.add(trunk);
    for (let i = 0; i < 3; i++) {
      const branch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), deadWoodMat);
      branch.position.set(x + (i - 1) * 0.2, 1.7 + i * 0.2, z);
      branch.rotation.z = -0.6 + i * 0.5;
      branch.rotation.y = Math.random() * Math.PI;
      branch.castShadow = true;
      root.add(branch);
    }
  });

  for (let i = 0; i < 18; i++) {
    const bramble = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), brambleMat);
    bramble.position.set((Math.random() - 0.5) * 20, 0.24, (Math.random() - 0.5) * 20);
    bramble.scale.set(0.7 + Math.random() * 0.4, 0.55 + Math.random() * 0.2, 0.7 + Math.random() * 0.4);
    bramble.castShadow = true;
    root.add(bramble);
  }

  for (let i = 0; i < 20; i++) {
    const ruin = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.28, 0),
      i % 3 === 0 ? steelMat : stoneMat
    );
    ruin.position.set((Math.random() - 0.5) * 18, 0.12, (Math.random() - 0.5) * 18);
    ruin.scale.y = 0.55 + Math.random() * 0.4;
    ruin.rotation.y = Math.random() * Math.PI;
    ruin.castShadow = true;
    root.add(ruin);
  }

  for (let i = 0; i < 16; i++) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.1, 0.55), stoneMat);
    const theta = (i / 16) * Math.PI * 2;
    pillar.position.set(Math.cos(theta) * (mapHalfSize - 1.2), 1.05, Math.sin(theta) * (mapHalfSize - 1.2));
    pillar.castShadow = true;
    root.add(pillar);
  }

  const edgeBlockers = addOrganicBlockers(root, mapHalfSize - 1.7, 40, mossMat, stoneMat);

  return {
    id: 'ironwoodReach',
    label: AREA_LABELS.ironwoodReach,
    root,
    cropRoot,
    mapHalfSize,
    spawn: { x: 0, z: 8.2, rotY: Math.PI },
    edgeBlockers,
    allowsFarming: false
  };
}

export function buildAreas(tileSize: number, gridUnits: number): Record<AreaId, BuiltArea> {
  return {
    farmstead: buildFarmstead(tileSize, gridUnits),
    ironwoodReach: buildIronwoodReach(tileSize, gridUnits)
  };
}

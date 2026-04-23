import * as THREE from 'three/webgpu';

const W = 0.56;
const H = 0.11;
const FILL_H = 0.052;

const COL_TH_A = new THREE.Color(0xff0066);
const COL_TH_B = new THREE.Color(0x00f5ff);
const COL_C = new THREE.Color(0x00e5ff);
const COL_D = new THREE.Color(0xccff00);

function barMaterial(hex: number) {
  return new THREE.MeshBasicMaterial({
    color: hex,
    toneMapped: false,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: 1
  });
}

/**
 * Slick, high-contrast world-space bar that billboards to the camera.
 * States: thirsty (pulsing neon), growing (cyan→lime by progress), ready (gold pulse).
 */
export function createCropProgressBar3D() {
  const root = new THREE.Group();
  root.name = 'cropProgressBar3D';
  root.renderOrder = 5;

  // Wide soft glow plate (reads at night)
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.35, H * 1.5),
    barMaterial(0x0a0a0f)
  );
  glow.renderOrder = 4;
  glow.position.z = 0.001;
  (glow.material as THREE.MeshBasicMaterial).opacity = 0.96;
  (glow.material as THREE.MeshBasicMaterial).transparent = true;
  root.add(glow);

  // Outer rim (high-contrast)
  const rim = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.12, H * 1.22),
    barMaterial(0x1a0a0a)
  );
  rim.position.z = 0.002;
  root.add(rim);

  const lineEdges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W * 1.1, H * 1.18));
  const line = new THREE.LineSegments(
    lineEdges,
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      toneMapped: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: 1
    })
  );
  line.position.z = 0.004;
  line.renderOrder = 6;
  root.add(line);

  const track = new THREE.Mesh(new THREE.PlaneGeometry(W, H * 0.5), barMaterial(0x030303));
  track.position.z = 0.005;
  track.renderOrder = 5;
  root.add(track);

  const fillW = W * 0.96;
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(fillW, FILL_H),
    barMaterial(0x00ffcc)
  );
  fill.position.z = 0.008;
  fill.renderOrder = 7;
  root.add(fill);

  const tmpC = new THREE.Color();

  function setFillColor(color: THREE.Color) {
    (fill.material as THREE.MeshBasicMaterial).color.copy(color);
  }

  return {
    root,
    setTransform(progress: number, state: 'thirsty' | 'growing' | 'ready', timeMs: number) {
      const s = state === 'ready' ? 1 : Math.max(0.02, progress);
      fill.scale.set(s, 1, 1);
      const half = fillW * 0.5;
      fill.position.x = -half * (1 - s);

      if (state === 'thirsty') {
        const t = Math.sin(timeMs * 0.0035) * 0.5 + 0.5;
        tmpC.copy(COL_TH_A).lerp(COL_TH_B, t);
        setFillColor(tmpC);
        return;
      }
      if (state === 'growing') {
        tmpC.copy(COL_C).lerp(COL_D, progress);
        setFillColor(tmpC);
        return;
      }
      // ready: hot gold with pulse
      const pulse = 0.88 + 0.12 * Math.sin(timeMs * 0.01);
      setFillColor(tmpC.setRGB(1, 0.78 * pulse, 0.12));
    },
    faceCamera(camera: THREE.Camera) {
      root.quaternion.copy(camera.quaternion);
    }
  };
}

export type CropProgressBar3D = ReturnType<typeof createCropProgressBar3D>;

export function getBarYLocal(isMature: boolean, cropType: string): number {
  if (!isMature) return 0.36;
  if (cropType === 'carrot' || cropType === 'flower') return 1.02;
  return 0.92;
}

export function ensureCropBar(
  crop: { mesh: THREE.Object3D; type: string; progressBar3d?: CropProgressBar3D; isReady?: boolean },
  isMature: boolean
) {
  if (crop.progressBar3d) return;
  const bar = createCropProgressBar3D();
  bar.root.position.set(0, getBarYLocal(isMature, crop.type), 0);
  crop.mesh.add(bar.root);
  crop.progressBar3d = bar;
}

export function removeCropBar(crop: { progressBar3d?: CropProgressBar3D; mesh: THREE.Object3D }) {
  const b = crop.progressBar3d;
  if (!b) return;
  b.root.removeFromParent();
  fillDispose(b);
  delete crop.progressBar3d;
}

function fillDispose(b: CropProgressBar3D) {
  b.root.traverse((o) => {
    const g = o as unknown as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
    g.geometry?.dispose();
    if (g.material) {
      if (Array.isArray(g.material)) g.material.forEach((m) => m.dispose());
      else g.material.dispose();
    }
  });
}

export function updateAllCropBars3D(
  map: Map<string, any>,
  camera: THREE.Camera,
  timeMs: number
) {
  map.forEach((crop) => {
    const b = crop.progressBar3d as CropProgressBar3D | undefined;
    if (!b) return;
    if (!crop.mesh.parent) return;
    const growT = Math.max(0.0001, crop.growTime);
    const progress = Math.min(1, crop.timer / growT);
    const state = crop.isReady ? 'ready' : !crop.isWatered ? 'thirsty' : 'growing';
    b.setTransform(progress, state, timeMs);
    b.faceCamera(camera);
  });
}

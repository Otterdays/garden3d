import * as THREE from 'three/webgpu';
import {
  BASE_MOVE_SPEED,
  SPRINT_MULTIPLIER
} from '../config/cameraConfig';
import type { EdgeBlocker } from '../config/worldConfig';
import { worldBounds } from '../config/worldConfig';

type KeyState = {
  w: boolean; a: boolean; s: boolean; d: boolean; shift: boolean;
};

type PlayerLimbs = {
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
};

/**
 * Camera-relative walk, soft blocker push, limb bob, optional footstep tick (uses Web Audio time).
 */
export function updatePlayerMovement(
  playerMesh: THREE.Group,
  camera: THREE.PerspectiveCamera,
  keys: KeyState,
  shopOpen: boolean,
  edgeBlockers: EdgeBlocker[],
  limbs: PlayerLimbs,
  dt: number,
  timeMs: number,
  audioCtx: AudioContext
): void {
  const moveSpeed = (keys.shift ? BASE_MOVE_SPEED * SPRINT_MULTIPLIER : BASE_MOVE_SPEED) * dt;
  const velocity = new THREE.Vector3(0, 0, 0);

  if (!shopOpen) {
    const inputX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const inputY = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
    if (inputX !== 0 || inputY !== 0) {
      const camForward = new THREE.Vector3();
      camera.getWorldDirection(camForward);
      camForward.y = 0;
      if (camForward.lengthSq() > 0) camForward.normalize();
      const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();
      velocity.addScaledVector(camForward, inputY).addScaledVector(camRight, inputX);
    }
  }

  if (velocity.length() > 0) {
    velocity.normalize().multiplyScalar(moveSpeed);
    playerMesh.position.add(velocity);
    playerMesh.position.x = THREE.MathUtils.clamp(
      playerMesh.position.x, worldBounds.minX, worldBounds.maxX
    );
    playerMesh.position.z = THREE.MathUtils.clamp(
      playerMesh.position.z, worldBounds.minZ, worldBounds.maxZ
    );
    for (const blocker of edgeBlockers) {
      const dx = playerMesh.position.x - blocker.x;
      const dz = playerMesh.position.z - blocker.z;
      const distSq = dx * dx + dz * dz;
      const minDist = blocker.radius + 0.45;
      if (distSq > 0 && distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const push = minDist - dist;
        playerMesh.position.x += (dx / dist) * push;
        playerMesh.position.z += (dz / dist) * push;
      }
    }
    const targetAngle = Math.atan2(velocity.x, velocity.z);
    let diff = targetAngle - playerMesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    playerMesh.rotation.y += diff * 10 * dt;
    playerMesh.position.y = Math.abs(Math.sin(timeMs * 0.015)) * 0.2;
    const swing = Math.sin(timeMs * 0.015);
    limbs.leftArm.rotation.x = swing;
    limbs.rightArm.rotation.x = -swing;
    limbs.leftLeg.rotation.x = -swing;
    limbs.rightLeg.rotation.x = swing;
    if (Math.abs(swing) > 0.95) {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(60, t);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  } else {
    playerMesh.position.y = THREE.MathUtils.lerp(playerMesh.position.y, 0.0, 10 * dt);
    limbs.leftArm.rotation.x = THREE.MathUtils.lerp(limbs.leftArm.rotation.x, 0, 10 * dt);
    limbs.rightArm.rotation.x = THREE.MathUtils.lerp(limbs.rightArm.rotation.x, 0, 10 * dt);
    limbs.leftLeg.rotation.x = THREE.MathUtils.lerp(limbs.leftLeg.rotation.x, 0, 10 * dt);
    limbs.rightLeg.rotation.x = THREE.MathUtils.lerp(limbs.rightLeg.rotation.x, 0, 10 * dt);
  }
}

import * as THREE from 'three/webgpu';
import {
  CAMERA_PAN_LIMIT,
  CAMERA_PAN_SPEED,
  cameraFollowOffset
} from '../config/cameraConfig';

type ArrowKeys = {
  arrowup: boolean; arrowdown: boolean; arrowleft: boolean; arrowright: boolean;
};

/**
 * Arrow-key offset pan, clamped, then isometric follow with zoom.
 */
export function updateFollowCamera(
  camera: THREE.PerspectiveCamera,
  playerPos: THREE.Vector3,
  cameraPan: THREE.Vector3,
  keys: ArrowKeys,
  dt: number,
  cameraZoom: number
): void {
  const speed = CAMERA_PAN_SPEED * dt;
  if (keys.arrowup) cameraPan.z -= speed;
  if (keys.arrowdown) cameraPan.z += speed;
  if (keys.arrowleft) cameraPan.x -= speed;
  if (keys.arrowright) cameraPan.x += speed;
  cameraPan.x = THREE.MathUtils.clamp(cameraPan.x, -CAMERA_PAN_LIMIT, CAMERA_PAN_LIMIT);
  cameraPan.z = THREE.MathUtils.clamp(cameraPan.z, -CAMERA_PAN_LIMIT, CAMERA_PAN_LIMIT);
  const zoom = cameraZoom;
  camera.position.x = playerPos.x + cameraPan.x + cameraFollowOffset.x * zoom;
  camera.position.z = playerPos.z + cameraPan.z + cameraFollowOffset.z * zoom;
  camera.position.y = cameraFollowOffset.y * zoom;
  camera.lookAt(
    playerPos.x + cameraPan.x * 0.4,
    playerPos.y,
    playerPos.z + cameraPan.z * 0.4
  );
}

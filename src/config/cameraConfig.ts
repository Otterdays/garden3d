import * as THREE from 'three/webgpu';

/** Isometric-style follow offset (world units); scaled by `STATE.cameraZoom` in the follow system. */
export const cameraFollowOffset = new THREE.Vector3(10, 10, 10);

export const CAMERA_PAN_LIMIT = 6;
export const CAMERA_PAN_SPEED = 8; // applied with dt in follow update

export const BASE_MOVE_SPEED = 4.0;
export const SPRINT_MULTIPLIER = 1.8;

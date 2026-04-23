import * as THREE from 'three/webgpu';
import { buildNpcTalkLine, getNearbyPoiLabel } from './npcDialogue';
import {
  createNpcFocusRing,
  createNpcNameLabel,
  createNpcSpeechBubble
} from './npcVisuals';

const NEIGHBOR_NAMES = [
  'Mara', 'Jules', 'Rowan', 'Eli', 'Niko', 'Sora', 'Bea', 'Owen', 'Iris', 'Theo', 'Greta', 'Sam'
];

const TOWN_POIS = [
  { label: 'market', x: 3, z: -6 },
  { label: 'well', x: -2, z: -6 },
  { label: 'campfire', x: 1, z: -4 },
  { label: 'farm', x: 3, z: 2 }
];

const TALK_RANGE = 2.5;

const PROXIMITY_BARKS = (name: string) => [
  `${name} nods as you pass.`,
  `You catch ${name} eyeing the market stall.`,
  `${name} stretches by the path.`,
  `${name} hums a quiet tune.`,
  `A relaxed hello from ${name}.`
][Math.floor(Math.random() * 5)];

interface NPCData {
  name: string;
  mesh: THREE.Group;
  nameLabel: ReturnType<typeof createNpcNameLabel>;
  speechBubble: ReturnType<typeof createNpcSpeechBubble>;
  focusRing: ReturnType<typeof createNpcFocusRing>;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  targetPos: THREE.Vector3;
  state: 'wandering' | 'idle' | 'talking' | 'leaving';
  timer: number;
  speed: number;
  affinity: number;
  talkCooldownUntil: number;
  preferredPoiLabel: string;
  phaseOffset: number;
}

export type NPCUpdateContext = {
  playerPos: THREE.Vector3;
  onBark: (line: string) => void;
  gameTime: number;
};

export class NPCManager {
  private scene: THREE.Scene;
  private npcs: NPCData[] = [];
  private spawnTimer = 0;
  private lastProximityBark = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private createNPCMesh(skinColor: number, shirtColor: number) {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardNodeMaterial({ color: skinColor, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardNodeMaterial({ color: shirtColor, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardNodeMaterial({ color: 0x3a2313, roughness: 0.95 });
    const trimMat = new THREE.MeshStandardNodeMaterial({ color: 0xf5f0d8, roughness: 0.85 });

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.33, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    group.add(shadow);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.4, 4, 16), shirtMat);
    torso.position.y = 0.7;
    torso.castShadow = true;
    group.add(torso);

    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20), trimMat);
    trim.position.set(0, 0.9, 0);
    trim.rotation.x = Math.PI / 2;
    group.add(trim);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), skinMat);
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hair.position.y = 1.36;
    hair.castShadow = true;
    group.add(hair);

    const eyeMat = new THREE.MeshBasicNodeMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    leftEye.position.set(-0.1, 1.3, 0.25);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    rightEye.position.set(0.1, 1.3, 0.25);
    group.add(leftEye, rightEye);

    const armGeo = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.35, 0.75, 0);
    leftArm.castShadow = true;
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.35, 0.75, 0);
    rightArm.castShadow = true;
    group.add(leftArm, rightArm);

    const legGeo = new THREE.CapsuleGeometry(0.1, 0.35, 4, 8);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.12, 0.25, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.12, 0.25, 0);
    rightLeg.castShadow = true;
    group.add(leftLeg, rightLeg);

    return { mesh: group, leftArm, rightArm, leftLeg, rightLeg };
  }

  private rotateTowards(npc: NPCData, targetPos: THREE.Vector3, dt: number) {
    const targetAngle = Math.atan2(targetPos.x - npc.mesh.position.x, targetPos.z - npc.mesh.position.z);
    let diff = targetAngle - npc.mesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    npc.mesh.rotation.y += diff * 8 * dt;
  }

  private getRandomTownPos() {
    return new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
  }

  private pickWanderTarget(preferredPoiLabel?: string) {
    const preferredPoi = TOWN_POIS.find((poi) => poi.label === preferredPoiLabel);
    if (preferredPoi && Math.random() < 0.55) {
      return new THREE.Vector3(
        preferredPoi.x + (Math.random() - 0.5) * 1.5,
        0,
        preferredPoi.z + (Math.random() - 0.5) * 1.5
      );
    }
    if (Math.random() < 0.45) {
      const poi = TOWN_POIS[Math.floor(Math.random() * TOWN_POIS.length)];
      return new THREE.Vector3(poi.x + (Math.random() - 0.5) * 1.5, 0, poi.z + (Math.random() - 0.5) * 1.5);
    }
    return this.getRandomTownPos();
  }

  private getNearbyNpc(playerPos: THREE.Vector3, maxDist = TALK_RANGE) {
    let best: NPCData | null = null;
    let bestDist = Infinity;
    for (const npc of this.npcs) {
      if (npc.state === 'leaving') continue;
      const dist = npc.mesh.position.distanceTo(playerPos);
      if (dist < bestDist && dist <= maxDist) {
        best = npc;
        bestDist = dist;
      }
    }
    return best;
  }

  private cleanupNpc(npc: NPCData) {
    npc.nameLabel.dispose();
    npc.speechBubble.dispose();
    npc.focusRing.dispose();
    this.scene.remove(npc.mesh);
  }

  public getInteractionPrompt(playerPos: THREE.Vector3) {
    const npc = this.getNearbyNpc(playerPos);
    if (!npc || npc.state === 'talking') return null;
    return `Press F to talk to ${npc.name}.`;
  }

  public interactNearest(playerPos: THREE.Vector3, gameTime: number, timeMs: number, onBark: (line: string) => void) {
    const npc = this.getNearbyNpc(playerPos);
    if (!npc || timeMs < npc.talkCooldownUntil) return false;

    npc.state = 'talking';
    npc.timer = 2.9;
    npc.talkCooldownUntil = timeMs + 5000;
    npc.affinity = Math.min(3, npc.affinity + 1);
    npc.targetPos.copy(npc.mesh.position);

    const poiLabel = getNearbyPoiLabel(npc.mesh.position, TOWN_POIS) ?? npc.preferredPoiLabel;
    const line = buildNpcTalkLine({
      name: npc.name,
      affinity: npc.affinity,
      gameTime,
      poiLabel
    });

    npc.speechBubble.setText(line);
    npc.speechBubble.setVisible(true);
    onBark(line);
    return true;
  }

  public spawnNPC() {
    const skins = [0xffccaa, 0xd2a18c, 0x8d5524, 0xc68642, 0xf1c27d];
    const shirts = [0xff4081, 0x4caf50, 0x2196f3, 0xffeb3b, 0x9c27b0];
    const parts = this.createNPCMesh(
      skins[Math.floor(Math.random() * skins.length)],
      shirts[Math.floor(Math.random() * shirts.length)]
    );
    const name = NEIGHBOR_NAMES[Math.floor(Math.random() * NEIGHBOR_NAMES.length)];
    const preferredPoi = TOWN_POIS[Math.floor(Math.random() * TOWN_POIS.length)];
    const nameLabel = createNpcNameLabel(name);
    const speechBubble = createNpcSpeechBubble();
    const focusRing = createNpcFocusRing();

    parts.mesh.add(nameLabel.sprite, speechBubble.sprite, focusRing.mesh);
    parts.mesh.position.set(
      (Math.random() > 0.5 ? 1 : -1) * 10,
      0,
      (Math.random() > 0.5 ? 1 : -1) * 10
    );
    this.scene.add(parts.mesh);

    const npc: NPCData = {
      name,
      ...parts,
      nameLabel,
      speechBubble,
      focusRing,
      targetPos: this.pickWanderTarget(preferredPoi.label),
      state: 'wandering',
      timer: 0,
      speed: 1.4 + Math.random() * 1.2,
      affinity: 0,
      talkCooldownUntil: 0,
      preferredPoiLabel: preferredPoi.label,
      phaseOffset: Math.random() * 1000
    };

    if (import.meta.env.DEV) {
      console.log(`[NPC] ${name} arrived near the ${preferredPoi.label}.`);
    }
    this.npcs.push(npc);
  }

  private maybeProximityBark(playerPos: THREE.Vector3, timeMs: number, onBark: (line: string) => void) {
    if (timeMs - this.lastProximityBark < 12_000) return;
    const npc = this.getNearbyNpc(playerPos, 2.6);
    if (!npc || npc.state === 'talking') return;
    this.lastProximityBark = timeMs;
    onBark(PROXIMITY_BARKS(npc.name));
  }

  public update(dt: number, timeMs: number, ctx?: NPCUpdateContext) {
    this.spawnTimer += dt;
    if (this.spawnTimer > 10.0 && this.npcs.length < 3) {
      this.spawnTimer = 0;
      if (Math.random() > 0.45) {
        this.spawnNPC();
      }
    }

    const focusedNpc = ctx?.playerPos ? this.getNearbyNpc(ctx.playerPos) : null;

    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];
      const bob = Math.sin((timeMs + npc.phaseOffset) * 0.012);

      npc.focusRing.update(
        npc.state === 'talking' ? 'talking' : npc === focusedNpc ? 'near' : 'hidden',
        timeMs
      );

      if (npc.state === 'talking' && ctx?.playerPos) {
        npc.timer -= dt;
        npc.mesh.position.y = 0.02 + Math.abs(bob) * 0.04;
        this.rotateTowards(npc, ctx.playerPos, dt);
        npc.leftArm.rotation.x = 0.35 + bob * 0.15;
        npc.rightArm.rotation.x = -0.1;
        npc.leftLeg.rotation.x = 0;
        npc.rightLeg.rotation.x = 0;

        if (npc.timer <= 0) {
          npc.state = 'idle';
          npc.timer = 1.6 + Math.random() * 1.5;
          npc.speechBubble.setVisible(false);
        }
        continue;
      }

      const dist = npc.mesh.position.distanceTo(npc.targetPos);
      if (npc.state === 'wandering' || npc.state === 'leaving') {
        if (dist > 0.1) {
          const direction = new THREE.Vector3().subVectors(npc.targetPos, npc.mesh.position).normalize();
          npc.mesh.position.add(direction.multiplyScalar(npc.speed * dt));
          npc.mesh.position.y = Math.abs(bob) * 0.12;
          this.rotateTowards(npc, npc.targetPos, dt);
          npc.leftArm.rotation.x = bob;
          npc.rightArm.rotation.x = -bob;
          npc.leftLeg.rotation.x = -bob;
          npc.rightLeg.rotation.x = bob;
        } else if (npc.state === 'leaving') {
          this.cleanupNpc(npc);
          this.npcs.splice(i, 1);
          continue;
        } else {
          npc.state = 'idle';
          npc.timer = 2 + Math.random() * 4;
        }
        continue;
      }

      npc.timer -= dt;
      npc.mesh.position.y = THREE.MathUtils.lerp(npc.mesh.position.y, 0, 10 * dt);
      npc.leftArm.rotation.x = THREE.MathUtils.lerp(npc.leftArm.rotation.x, 0.08 * bob, 10 * dt);
      npc.rightArm.rotation.x = THREE.MathUtils.lerp(npc.rightArm.rotation.x, -0.08 * bob, 10 * dt);
      npc.leftLeg.rotation.x = THREE.MathUtils.lerp(npc.leftLeg.rotation.x, 0, 10 * dt);
      npc.rightLeg.rotation.x = THREE.MathUtils.lerp(npc.rightLeg.rotation.x, 0, 10 * dt);
      if (focusedNpc === npc && ctx?.playerPos) {
        this.rotateTowards(npc, ctx.playerPos, dt);
      }

      if (npc.timer <= 0) {
        if (Math.random() > 0.84) {
          npc.state = 'leaving';
          npc.targetPos = new THREE.Vector3(
            (Math.random() > 0.5 ? 1 : -1) * 15,
            0,
            (Math.random() > 0.5 ? 1 : -1) * 15
          );
        } else {
          npc.state = 'wandering';
          npc.targetPos = this.pickWanderTarget(npc.preferredPoiLabel);
        }
      }
    }

    if (ctx?.playerPos) {
      this.maybeProximityBark(ctx.playerPos, timeMs, ctx.onBark);
    }
  }
}

import * as THREE from 'three/webgpu';

interface NPCData {
  mesh: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  targetPos: THREE.Vector3;
  state: 'wandering' | 'idle' | 'leaving';
  timer: number;
  speed: number;
}

export class NPCManager {
  private scene: THREE.Scene;
  private npcs: NPCData[] = [];
  private spawnTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Procedural NPC geometric builder
  private createNPCMesh(skinColor: number, shirtColor: number): any {
    const group = new THREE.Group();
    
    // Mat
    const skinMat = new THREE.MeshStandardNodeMaterial({ color: skinColor, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardNodeMaterial({ color: shirtColor, roughness: 0.8 });
    
    // Torso (Shirt)
    const torsoGeo = new THREE.CapsuleGeometry(0.25, 0.4, 4, 16);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 0.7;
    torso.castShadow = true;
    group.add(torso);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);
    
    // Eyes
    const eyeMat = new THREE.MeshBasicNodeMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 1.3, 0.25);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 1.3, 0.25);
    group.add(leftEye);
    group.add(rightEye);
    
    // Floppy Arms
    const armGeo = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.35, 0.75, 0);
    leftArm.castShadow = true;
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.35, 0.75, 0);
    rightArm.castShadow = true;
    group.add(leftArm);
    group.add(rightArm);
    
    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.1, 0.35, 4, 8);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.12, 0.25, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.12, 0.25, 0);
    rightLeg.castShadow = true;
    group.add(leftLeg);
    group.add(rightLeg);
    
    return { mesh: group, leftArm, rightArm, leftLeg, rightLeg };
  }

  public spawnNPC() {
    // Determine random colors for variety
    const skins = [0xffccaa, 0xd2a18c, 0x8d5524, 0xc68642, 0xf1c27d];
    const shirts = [0xff4081, 0x4caf50, 0x2196f3, 0xffeb3b, 0x9c27b0];
    const skin = skins[Math.floor(Math.random() * skins.length)];
    const shirt = shirts[Math.floor(Math.random() * shirts.length)];

    const parts = this.createNPCMesh(skin, shirt);
    
    // Spawn arbitrarily on the edge of the grid
    const startX = (Math.random() > 0.5 ? 1 : -1) * 10;
    const startZ = (Math.random() > 0.5 ? 1 : -1) * 10;
    
    parts.mesh.position.set(startX, 0, startZ);
    this.scene.add(parts.mesh);

    const npc: NPCData = {
      ...parts,
      targetPos: this.getRandomTownPos(),
      state: 'wandering',
      timer: 0,
      speed: 1.5 + Math.random() * 1.5 // Walking speed
    };

    console.log(`[NPCSystem] A neighbor popped into town!`);
    this.npcs.push(npc);
  }

  private getRandomTownPos(): THREE.Vector3 {
    // Generate a random position inside the town square / farm area
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    return new THREE.Vector3(x, 0, z);
  }

  public update(dt: number, now: number) {
    // Random "Pop in" spawner - rough probability check
    this.spawnTimer += dt;
    if (this.spawnTimer > 10.0 && this.npcs.length < 3) {
      this.spawnTimer = 0;
      if (Math.random() > 0.5) {
         this.spawnNPC();
      }
    }

    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];

      // Distance to target
      const dist = npc.mesh.position.distanceTo(npc.targetPos);

      if (npc.state === 'wandering' || npc.state === 'leaving') {
        if (dist > 0.1) {
          // Move towards target
          const direction = new THREE.Vector3().subVectors(npc.targetPos, npc.mesh.position).normalize();
          npc.mesh.position.add(direction.multiplyScalar(npc.speed * dt));
          
          // Smooth rotation towards target using exact heading
          const targetAngle = Math.atan2(direction.x, direction.z);
          let diff = targetAngle - npc.mesh.rotation.y;
          while(diff < -Math.PI) diff += Math.PI * 2;
          while(diff > Math.PI) diff -= Math.PI * 2;
          npc.mesh.rotation.y += diff * 10 * dt;

          // Walking Animation
          npc.mesh.position.y = Math.abs(Math.sin(now * 0.015)) * 0.15;
          const swing = Math.sin(now * 0.015);
          npc.leftArm.rotation.x = swing;
          npc.rightArm.rotation.x = -swing;
          npc.leftLeg.rotation.x = -swing;
          npc.rightLeg.rotation.x = swing;
        } else {
          // Arrived at target
          if (npc.state === 'leaving') {
            this.scene.remove(npc.mesh);
            this.npcs.splice(i, 1); // Despawn
            continue;
          } else {
             // Become idle
             npc.state = 'idle';
             npc.timer = 2 + Math.random() * 5; // wait 2-7 seconds
          }
        }
      } else if (npc.state === 'idle') {
         npc.timer -= dt;
         // Settle to ground
         npc.mesh.position.y = THREE.MathUtils.lerp(npc.mesh.position.y, 0.0, 10 * dt);
         npc.leftArm.rotation.x = THREE.MathUtils.lerp(npc.leftArm.rotation.x, 0, 10 * dt);
         npc.rightArm.rotation.x = THREE.MathUtils.lerp(npc.rightArm.rotation.x, 0, 10 * dt);
         npc.leftLeg.rotation.x = THREE.MathUtils.lerp(npc.leftLeg.rotation.x, 0, 10 * dt);
         npc.rightLeg.rotation.x = THREE.MathUtils.lerp(npc.rightLeg.rotation.x, 0, 10 * dt);

         if (npc.timer <= 0) {
            // Decide to wander to a new place or leave city
            if (Math.random() > 0.8) {
               npc.state = 'leaving';
               npc.targetPos = new THREE.Vector3((Math.random() > 0.5 ? 1 : -1) * 15, 0, (Math.random() > 0.5 ? 1 : -1) * 15);
            } else {
               npc.state = 'wandering';
               npc.targetPos = this.getRandomTownPos();
            }
         }
      }
    }
  }
}

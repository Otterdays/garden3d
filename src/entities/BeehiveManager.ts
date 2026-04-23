import * as THREE from 'three/webgpu';

// Beehive configuration
export const POLLINATOR_CONFIG = {
  BEEHIVE_COST: 150,
  HONEY_SELL_PRICE: 25,
  POLLINATION_RANGE: 4.5, // tiles from hive (in tile units, not world units)
  HONEY_GROW_TIME: 60,    // seconds to produce honey
};

export interface BeehiveData {
  mesh: THREE.Group;
  gridX: number;
  gridZ: number;
  honeyReady: boolean;
  honeyProgress: number;
  honeyCount: number;
  // For animation
  honeyPulseTime: number;
}

export class BeehiveManager {
  private scene: THREE.Scene;
  private worldGroup: THREE.Group;
  private beehives: BeehiveData[] = [];
  
  // Materials
  private hiveMat: THREE.MeshStandardNodeMaterial;
  private roofMat: THREE.MeshStandardNodeMaterial;
  private beeMat: THREE.PointsMaterial;
  private honeyMat: THREE.MeshStandardNodeMaterial;
  
  // Bee particles
  private beePositions: Float32Array;
  private beeVelocities: Array<{ x: number; y: number; z: number; targetHiveIdx: number }>;
  private beeMesh: THREE.Points | null = null;
  private readonly MAX_BEES = 20;
  
  constructor(scene: THREE.Scene, worldGroup: THREE.Group) {
    this.scene = scene;
    this.worldGroup = worldGroup;
    
    // Materials
    this.hiveMat = new THREE.MeshStandardNodeMaterial({ color: 0xd4a574, roughness: 0.9 });
    this.roofMat = new THREE.MeshStandardNodeMaterial({ color: 0x4a3728, roughness: 1.0 });
    this.honeyMat = new THREE.MeshStandardNodeMaterial({ color: 0xffc107, roughness: 0.3, metalness: 0.2 });
    
    // Bee particle material
    this.beeMat = new THREE.PointsMaterial({
      color: 0xffc107,
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9
    });
    
    // Initialize bee tracking arrays
    this.beePositions = new Float32Array(this.MAX_BEES * 3);
    this.beeVelocities = [];
    for (let i = 0; i < this.MAX_BEES; i++) {
      this.beeVelocities.push({
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 0.3,
        z: (Math.random() - 0.5) * 2,
        targetHiveIdx: 0
      });
    }
    
    this.initBeeMesh();
  }
  
  // Create beehive 3D mesh
  private createHiveMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Main body (cylinder with horizontal lines for texture)
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.7, 12);
    const body = new THREE.Mesh(bodyGeo, this.hiveMat);
    body.position.y = 0.35;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Horizontal bands on hive
    const bandGeo = new THREE.TorusGeometry(0.42, 0.02, 6, 16);
    [-0.1, 0.15, 0.4].forEach(y => {
      const band = new THREE.Mesh(bandGeo, this.roofMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = y + 0.35;
      group.add(band);
    });
    
    // Top roof (cone)
    const roofGeo = new THREE.ConeGeometry(0.5, 0.35, 8);
    const roof = new THREE.Mesh(roofGeo, this.roofMat);
    roof.position.y = 0.9;
    roof.castShadow = true;
    group.add(roof);
    
    // Small entrance hole
    const entranceGeo = new THREE.CircleGeometry(0.12, 12);
    const entranceMat = new THREE.MeshBasicNodeMaterial({ color: 0x1a1a1a });
    const entrance = new THREE.Mesh(entranceGeo, entranceMat);
    entrance.position.set(0, 0.35, 0.41);
    group.add(entrance);
    
    // Honey indicator sphere (hidden until honey ready)
    const honeyGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const honeyIndicator = new THREE.Mesh(honeyGeo, this.honeyMat);
    honeyIndicator.position.set(0.5, 0.35, 0);
    honeyIndicator.visible = false;
    honeyIndicator.name = 'honeyIndicator';
    group.add(honeyIndicator);
    
    // Hanging wire/bracket
    const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
    const wire = new THREE.Mesh(wireGeo, this.roofMat);
    wire.position.y = 1.1;
    group.add(wire);
    
    return group;
  }
  
  // Initialize bee particle system
  private initBeeMesh() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.beePositions, 3));
    
    this.beeMesh = new THREE.Points(geo, this.beeMat);
    this.scene.add(this.beeMesh);
  }
  
  // Place a new beehive at grid position
  public placeHive(gridX: number, gridZ: number, tileSize: number): BeehiveData | null {
    // Check if position is already occupied by a hive
    if (this.beehives.some(h => h.gridX === gridX && h.gridZ === gridZ)) {
      return null;
    }
    
    const worldX = gridX * tileSize;
    const worldZ = gridZ * tileSize;
    
    const mesh = this.createHiveMesh();
    mesh.position.set(worldX, 0, worldZ);
    this.worldGroup.add(mesh);
    
    const hive: BeehiveData = {
      mesh,
      gridX,
      gridZ,
      honeyReady: false,
      honeyProgress: 0,
      honeyCount: 0,
      honeyPulseTime: 0
    };
    
    this.beehives.push(hive);
    console.log(`[BeehiveManager] Placed beehive at grid (${gridX}, ${gridZ})`);
    
    return hive;
  }
  
  // Check if a grid position is within pollination range of any beehive
  public isPollinated(gridX: number, gridZ: number): boolean {
    return this.beehives.some(hive => {
      const dx = hive.gridX - gridX;
      const dz = hive.gridZ - gridZ;
      return Math.sqrt(dx * dx + dz * dz) <= POLLINATOR_CONFIG.POLLINATION_RANGE;
    });
  }
  
  // Get total honey ready for harvest
  public getTotalHoneyReady(): number {
    return this.beehives.reduce((sum, h) => sum + (h.honeyReady ? h.honeyCount : 0), 0);
  }
  
  // Update all beehives (honey production, animations)
  public update(dt: number, timeMs: number) {
    // Update each hive
    for (const hive of this.beehives) {
      // Honey production timer
      if (!hive.honeyReady) {
        hive.honeyProgress += dt;
        if (hive.honeyProgress >= POLLINATOR_CONFIG.HONEY_GROW_TIME) {
          hive.honeyReady = true;
          hive.honeyCount = 1;
          // Show honey indicator
          const indicator = hive.mesh.getObjectByName('honeyIndicator') as THREE.Mesh;
          if (indicator) indicator.visible = true;
          console.log(`[BeehiveManager] Honey ready at (${hive.gridX}, ${hive.gridZ})`);
        }
      }
      
      // Honey pulse animation when ready
      if (hive.honeyReady) {
        hive.honeyPulseTime += dt;
        const indicator = hive.mesh.getObjectByName('honeyIndicator') as THREE.Mesh;
        if (indicator) {
          const scale = 1 + Math.sin(hive.honeyPulseTime * 3) * 0.2;
          indicator.scale.setScalar(scale);
        }
      }
    }
    
    // Update bee particles
    this.updateBees(dt, timeMs);
  }
  
  // Update bee particle positions
  private updateBees(dt: number, timeMs: number) {
    if (!this.beeMesh || this.beehives.length === 0) {
      // Hide bees if no hives
      if (this.beeMesh) this.beeMesh.visible = false;
      return;
    }
    
    this.beeMesh.visible = true;
    
    for (let i = 0; i < this.MAX_BEES; i++) {
      const idx = i * 3;
      
      // Pick a target hive
      const hiveIdx = i % this.beehives.length;
      const hive = this.beehives[hiveIdx];
      
      // Target position (near hive)
      const targetX = hive.mesh.position.x + (Math.random() - 0.5) * 2;
      const targetY = hive.mesh.position.y + 0.3 + Math.random() * 1.5;
      const targetZ = hive.mesh.position.z + (Math.random() - 0.5) * 2;
      
      // Move towards target with some randomness
      this.beePositions[idx] += (targetX - this.beePositions[idx]) * 0.5 * dt;
      this.beePositions[idx + 1] += (targetY - this.beePositions[idx + 1]) * 0.3 * dt;
      this.beePositions[idx + 2] += (targetZ - this.beePositions[idx + 2]) * 0.5 * dt;
      
      // Add buzz motion
      this.beePositions[idx] += Math.sin(timeMs * 0.02 + i) * 0.01;
      this.beePositions[idx + 1] += Math.cos(timeMs * 0.03 + i * 0.5) * 0.005;
    }
    
    (this.beeMesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  
  // Harvest honey from a specific hive
  public harvestHoney(gridX: number, gridZ: number): number {
    const hive = this.beehives.find(h => h.gridX === gridX && h.gridZ === gridZ);
    if (hive && hive.honeyReady) {
      const count = hive.honeyCount;
      hive.honeyReady = false;
      hive.honeyProgress = 0;
      hive.honeyCount = 0;
      
      // Hide honey indicator
      const indicator = hive.mesh.getObjectByName('honeyIndicator') as THREE.Mesh;
      if (indicator) indicator.visible = false;
      
      console.log(`[BeehiveManager] Harvested ${count} honey from (${gridX}, ${gridZ})`);
      return count;
    }
    return 0;
  }
  
  // Get all beehives
  public getAllHives(): BeehiveData[] {
    return this.beehives;
  }
  
  // Get count of active hives
  public getHiveCount(): number {
    return this.beehives.length;
  }
  
  // Clean up
  public dispose() {
    if (this.beeMesh) {
      this.scene.remove(this.beeMesh);
      this.beeMesh.geometry.dispose();
    }
  }
}

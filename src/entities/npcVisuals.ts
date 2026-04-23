import * as THREE from 'three/webgpu';

type SpriteLabel = {
  sprite: THREE.Sprite;
  setText: (text: string) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
};

type FocusRingMode = 'hidden' | 'near' | 'talking';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.rect(x, y, w, h);
}

function createTextSprite(config: {
  width: number;
  height: number;
  worldHeight: number;
  y: number;
  centerY: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, text: string) => void;
  initialText: string;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable for NPC label sprite.');
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, config.centerY);
  sprite.position.set(0, config.y, 0);
  const aspect = config.width / config.height;
  sprite.scale.set(config.worldHeight * aspect, config.worldHeight, 1);

  const setText = (text: string) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    config.draw(ctx, canvas.width, canvas.height, text);
    texture.needsUpdate = true;
  };

  setText(config.initialText);

  return {
    sprite,
    setText,
    setVisible(visible: boolean) {
      sprite.visible = visible;
    },
    dispose() {
      texture.dispose();
      material.dispose();
    }
  } satisfies SpriteLabel;
}

function wrapText(text: string, maxLineLength = 26) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxLineLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function createNpcNameLabel(name: string) {
  return createTextSprite({
    width: 512,
    height: 128,
    worldHeight: 0.55,
    y: 1.72,
    centerY: 0.3,
    initialText: name,
    draw(ctx, w, h, text) {
      ctx.font = 'bold 52px "Outfit", "Segoe UI", system-ui, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const padX = 32;
      const pillWidth = Math.min(textWidth + padX * 2, w - 16);
      const pillHeight = 84;
      const x = (w - pillWidth) * 0.5;
      const y = (h - pillHeight) * 0.5;

      drawRoundedRect(ctx, x, y, pillWidth, pillHeight, 14);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fill();
      drawRoundedRect(ctx, x, y, pillWidth, pillHeight, 14);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(168, 255, 120, 0.55)';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.88)';
      ctx.strokeText(text, w * 0.5, h * 0.5);
      ctx.fillStyle = '#ecffea';
      ctx.fillText(text, w * 0.5, h * 0.5);
    }
  });
}

export function createNpcSpeechBubble() {
  const bubble = createTextSprite({
    width: 768,
    height: 240,
    worldHeight: 0.95,
    y: 2.3,
    centerY: 0.15,
    initialText: '',
    draw(ctx, w, _h, text) {
      const lines = wrapText(text);
      const bubbleWidth = w - 80;
      const bubbleHeight = 164;
      const x = (w - bubbleWidth) * 0.5;
      const y = 24;

      drawRoundedRect(ctx, x, y, bubbleWidth, bubbleHeight, 24);
      ctx.fillStyle = 'rgba(8, 10, 14, 0.88)';
      ctx.fill();
      drawRoundedRect(ctx, x, y, bubbleWidth, bubbleHeight, 24);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(117, 255, 235, 0.55)';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 18, y + bubbleHeight - 2);
      ctx.lineTo(w * 0.5 + 22, y + bubbleHeight - 2);
      ctx.lineTo(w * 0.5 - 6, y + bubbleHeight + 30);
      ctx.closePath();
      ctx.fillStyle = 'rgba(8, 10, 14, 0.88)';
      ctx.fill();

      ctx.font = '600 38px "Outfit", "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f6ffff';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 5;

      const startY = y + 56 + (lines.length === 1 ? 28 : 0);
      lines.forEach((line, index) => {
        const ly = startY + index * 42;
        ctx.strokeText(line, w * 0.5, ly);
        ctx.fillText(line, w * 0.5, ly);
      });
    }
  });
  bubble.setVisible(false);
  return bubble;
}

export function createNpcFocusRing() {
  const geometry = new THREE.RingGeometry(0.38, 0.5, 40);
  const material = new THREE.MeshBasicMaterial({
    color: 0x73f4ff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  mesh.visible = false;
  mesh.renderOrder = 20;

  return {
    mesh,
    update(mode: FocusRingMode, timeMs: number) {
      if (mode === 'hidden') {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      const pulse = Math.sin(timeMs * 0.006) * 0.06;
      if (mode === 'talking') {
        material.color.setHex(0xa8ff78);
        material.opacity = 0.95;
        mesh.scale.setScalar(1.12 + pulse);
        return;
      }
      material.color.setHex(0x73f4ff);
      material.opacity = 0.82;
      mesh.scale.setScalar(1.0 + pulse);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    }
  };
}

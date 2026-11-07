import * as THREE from 'three';

export function createFloorWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm marine plywood base
  ctx.fillStyle = '#b3824b';
  ctx.fillRect(0, 0, 1024, 1024);

  // Planks across length
  const plankHeight = 64;
  for (let y = 0; y < 1024; y += plankHeight) {
    // Subtle plank color variance
    const shade = (Math.sin(y * 12.3) * 0.5 + 0.5) * 20 - 10;
    const r = Math.min(255, Math.max(0, 179 + shade));
    const g = Math.min(255, Math.max(0, 130 + shade * 0.8));
    const b = Math.min(255, Math.max(0, 75 + shade * 0.5));
    ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    ctx.fillRect(0, y, 1024, plankHeight);

    // Plank seam
    ctx.strokeStyle = '#5a3d1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();

    // Wood grain noise lines
    ctx.strokeStyle = 'rgba(74, 48, 22, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const lineY = y + 10 + i * 14;
      ctx.beginPath();
      ctx.moveTo(0, lineY + (Math.random() - 0.5) * 3);
      for (let x = 0; x < 1024; x += 128) {
        ctx.lineTo(x, lineY + (Math.sin(x * 0.02) * 2));
      }
      ctx.stroke();
    }

    // Screw / rivet marks on floor
    ctx.fillStyle = '#3f2b18';
    for (let x = 60; x < 1024; x += 160) {
      ctx.beginPath();
      ctx.arc(x, y + 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPalletWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Fresh pine pallet wood color
  ctx.fillStyle = '#dfba85';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle wood fiber bands
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(180, 138, 90, 0.25)' : 'rgba(240, 215, 170, 0.3)';
    ctx.fillRect(0, y, 512, 1 + Math.random() * 3);
  }

  // Darker wood knots
  for (let k = 0; k < 3; k++) {
    const kx = 100 + Math.random() * 300;
    const ky = 50 + Math.random() * 400;
    ctx.fillStyle = 'rgba(120, 80, 45, 0.35)';
    ctx.beginPath();
    ctx.ellipse(kx, ky, 18, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCartonTexture(labelTitle: string = 'FRAGILE'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Kraft cardboard base
  ctx.fillStyle = '#c89d68';
  ctx.fillRect(0, 0, 512, 512);

  // Cardboard texture flecks
  ctx.fillStyle = 'rgba(110, 75, 40, 0.12)';
  for (let i = 0; i < 600; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // Brown packaging tape along top/center
  ctx.fillStyle = '#9e6d38';
  ctx.fillRect(0, 240, 512, 32);

  // White shipping label sticker
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(60, 60, 220, 140);
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 220, 140);

  // Barcode lines
  ctx.fillStyle = '#111111';
  let bx = 75;
  while (bx < 265) {
    const w = Math.random() > 0.4 ? 4 : 2;
    ctx.fillRect(bx, 75, w, 40);
    bx += w + (Math.random() > 0.5 ? 4 : 2);
  }

  // Text on label
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#e11d48'; // red
  ctx.fillText(labelTitle, 75, 140);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#333333';
  ctx.fillText('HANDLE WITH CARE', 75, 160);
  ctx.fillText('EXP-ID: PLT-904', 75, 180);

  // Arrow up icon (This Side Up)
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(250, 160);
  ctx.lineTo(250, 140);
  ctx.lineTo(245, 145);
  ctx.moveTo(250, 140);
  ctx.lineTo(255, 145);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCorrugatedNormalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Normal map neutral purple
  const imgData = ctx.createImageData(256, 256);
  const data = imgData.data;

  // Wave period 32px
  for (let x = 0; x < 256; x++) {
    const angle = (x / 32) * Math.PI * 2;
    // Slope derivative for normal map X
    const slope = -Math.cos(angle);
    const nx = Math.floor((slope * 0.5 + 0.5) * 255);
    const nz = 230; // Strong upward Z normal

    for (let y = 0; y < 256; y++) {
      const idx = (y * 256 + x) * 4;
      data[idx] = nx;      // R: Normal X
      data[idx + 1] = 128; // G: Normal Y
      data[idx + 2] = nz;  // B: Normal Z
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 2);
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.08)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

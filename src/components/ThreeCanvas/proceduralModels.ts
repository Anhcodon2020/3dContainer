import * as THREE from 'three';
import { CenterOfGravity, ContainerDef, PlacedPallet } from '../../types/logistics';
import { createContactShadowTexture } from './proceduralTextures';

// Scale factor: Convert mm to meters for Three.js scene (1 unit = 1 meter)
export const MM_TO_M = 0.001;

let sharedShadowTex: THREE.CanvasTexture | null = null;
function getSharedShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadowTex) {
    sharedShadowTex = createContactShadowTexture();
  }
  return sharedShadowTex;
}

/**
 * Creates a composite 7-9 part procedural Pallet model with cargo,
 * wood deck, stringer blocks, strapping bands, and corner protectors.
 */
export function createProceduralPalletGroup(
  pallet: PlacedPallet,
  woodTexture: THREE.Texture,
  cartonTexture: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  group.name = `pallet-${pallet.index}`;
  group.userData = {
    isPallet: true,
    palletData: pallet
  };

  const l = pallet.lengthMm * MM_TO_M;
  const w = pallet.widthMm * MM_TO_M;
  const totalH = pallet.heightMm * MM_TO_M;

  const palletBaseH = 0.144; // 144mm standard wooden pallet base
  const cargoH = Math.max(0.1, totalH - palletBaseH);

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.85,
    metalness: 0.05,
    color: '#e2ba82'
  });

  const cargoMat = new THREE.MeshStandardMaterial({
    map: cartonTexture,
    roughness: 0.55,
    metalness: 0.1,
    color: pallet.color || '#3b82f6'
  });

  const strapMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.25,
    metalness: 0.3
  });

  const protectorMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.4,
    metalness: 0.1
  });

  // 1. Part 1: Bottom deck skids (3 boards)
  const bottomSkidThick = 0.022;
  const bottomSkidW = 0.1;
  const skidGeom = new THREE.BoxGeometry(l, bottomSkidThick, bottomSkidW);

  const skidPositions = [-w / 2 + bottomSkidW / 2, 0, w / 2 - bottomSkidW / 2];
  skidPositions.forEach(posZ => {
    const skid = new THREE.Mesh(skidGeom, woodMat);
    skid.position.set(0, bottomSkidThick / 2, posZ);
    skid.castShadow = true;
    skid.receiveShadow = true;
    group.add(skid);
  });

  // 2. Part 2: Middle wooden blocks (9 blocks: 3x3)
  const blockH = 0.078;
  const blockL = 0.14;
  const blockW = 0.1;
  const blockGeom = new THREE.BoxGeometry(blockL, blockH, blockW);

  const blockX = [-l / 2 + blockL / 2, 0, l / 2 - blockL / 2];
  const blockZ = [-w / 2 + blockW / 2, 0, w / 2 - blockW / 2];

  for (const bx of blockX) {
    for (const bz of blockZ) {
      const block = new THREE.Mesh(blockGeom, woodMat);
      block.position.set(bx, bottomSkidThick + blockH / 2, bz);
      block.castShadow = true;
      group.add(block);
    }
  }

  // 3. Part 3: Top deck boards (5 to 7 planks)
  const topBoardThick = 0.022;
  const topBoardW = 0.12;
  const numTopPlanks = Math.max(5, Math.floor(l / (topBoardW + 0.04)));
  const stepL = (l - topBoardW) / (numTopPlanks - 1);
  const topPlankGeom = new THREE.BoxGeometry(topBoardW, topBoardThick, w);

  for (let i = 0; i < numTopPlanks; i++) {
    const plankX = -l / 2 + topBoardW / 2 + i * stepL;
    const plank = new THREE.Mesh(topPlankGeom, woodMat);
    plank.position.set(plankX, bottomSkidThick + blockH + topBoardThick / 2, 0);
    plank.castShadow = true;
    group.add(plank);
  }

  // 4. Part 4: Main Cargo Block (Shrink-wrapped cartons)
  // Slightly indented by 15mm from pallet perimeter
  const cargoL = l - 0.03;
  const cargoW = w - 0.03;
  const cargoGeom = new THREE.BoxGeometry(cargoL, cargoH, cargoW);
  const cargoMesh = new THREE.Mesh(cargoGeom, cargoMat);
  cargoMesh.position.set(0, palletBaseH + cargoH / 2, 0);
  cargoMesh.castShadow = true;
  cargoMesh.receiveShadow = true;
  group.add(cargoMesh);

  // 5. Part 5: Plastic Strapping Bands (2 vertical loops)
  const strapThick = 0.003;
  const strapW = 0.025;
  const strapGeomX = new THREE.BoxGeometry(cargoL + 0.004, cargoH + 0.004, strapW);
  const strap1 = new THREE.Mesh(strapGeomX, strapMat);
  strap1.position.set(0, palletBaseH + cargoH / 2, -cargoW * 0.28);
  group.add(strap1);

  const strap2 = new THREE.Mesh(strapGeomX, strapMat);
  strap2.position.set(0, palletBaseH + cargoH / 2, cargoW * 0.28);
  group.add(strap2);

  // 6. Part 6: Corner Edge Protectors (4 vertical L-shaped corner strips)
  const protH = cargoH * 0.95;
  const protW = 0.04;
  const protThick = 0.005;
  const protGeom = new THREE.BoxGeometry(protW, protH, protThick);

  const corners = [
    { x: -cargoL / 2 + protW / 2, z: -cargoW / 2 },
    { x: cargoL / 2 - protW / 2, z: -cargoW / 2 },
    { x: -cargoL / 2 + protW / 2, z: cargoW / 2 },
    { x: cargoL / 2 - protW / 2, z: cargoW / 2 }
  ];
  corners.forEach(c => {
    const prot = new THREE.Mesh(protGeom, protectorMat);
    prot.position.set(c.x, palletBaseH + protH / 2, c.z);
    group.add(prot);
  });

  // 7. Part 7: Contact shadow plane under the pallet
  const shadowGeo = new THREE.PlaneGeometry(l * 1.08, w * 1.08);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getSharedShadowTexture(),
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002; // prevent z-fighting
  group.add(shadowMesh);

  // Position the pallet group at its calculated 3D coordinates
  group.position.set(pallet.xMm * MM_TO_M, (pallet.yMm - pallet.heightMm / 2) * MM_TO_M, pallet.zMm * MM_TO_M);

  return group;
}

/**
 * Creates a composite 3-12 part procedural Freight Container model
 * with corrugated walls, heavy corner castings, marine plywood floor,
 * upper/lower rails, and doors.
 */
export function createProceduralContainerGroup(
  container: ContainerDef,
  floorTexture: THREE.Texture,
  corrugatedNormal: THREE.Texture,
  viewMode: 'solid' | 'translucent' | 'wireframe' | 'open_top' = 'translucent',
  doorsOpen: boolean = true
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'freight-container';

  const l = container.innerLengthMm * MM_TO_M;
  const w = container.innerWidthMm * MM_TO_M;
  const h = container.innerHeightMm * MM_TO_M;

  const wallThickness = 0.06;
  const railSize = 0.08;

  // Materials
  const steelPaintColor = '#1e3a8a'; // Deep maritime blue
  const frameSteelColor = '#0f172a'; // Dark chassis steel

  const isTranslucent = viewMode === 'translucent';
  const isWireframe = viewMode === 'wireframe';
  const isOpenTop = viewMode === 'open_top';

  const wallMat = new THREE.MeshStandardMaterial({
    color: steelPaintColor,
    normalMap: corrugatedNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: isTranslucent ? 0.2 : 0.65,
    metalness: isTranslucent ? 0.1 : 0.4,
    transparent: isTranslucent || isWireframe,
    opacity: isWireframe ? 0.2 : isTranslucent ? 0.28 : 1.0,
    wireframe: isWireframe,
    side: THREE.DoubleSide,
    depthWrite: !isTranslucent
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: frameSteelColor,
    roughness: 0.4,
    metalness: 0.7
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.8,
    metalness: 0.1
  });

  // 1. Part 1: Marine plywood floor
  const floorGeo = new THREE.BoxGeometry(l, 0.035, w);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(l / 2, -0.0175, w / 2);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // 2. Part 2: Heavy bottom chassis crossmembers & side sills
  const bottomSillGeo = new THREE.BoxGeometry(l + 0.16, railSize, railSize);
  const bottomSillLeft = new THREE.Mesh(bottomSillGeo, frameMat);
  bottomSillLeft.position.set(l / 2, -railSize / 2, -railSize / 2);
  group.add(bottomSillLeft);

  const bottomSillRight = new THREE.Mesh(bottomSillGeo, frameMat);
  bottomSillRight.position.set(l / 2, -railSize / 2, w + railSize / 2);
  group.add(bottomSillRight);

  // 3. Part 3: 4 ISO Corner Posts & Corner Castings
  const postH = h + railSize;
  const postGeo = new THREE.BoxGeometry(railSize * 1.4, postH, railSize * 1.4);
  const castingGeo = new THREE.BoxGeometry(railSize * 1.6, railSize * 1.2, railSize * 1.6);
  const castingMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.3, metalness: 0.8 });

  const postPositions = [
    { x: -railSize / 2, z: -railSize / 2 },
    { x: l + railSize / 2, z: -railSize / 2 },
    { x: -railSize / 2, z: w + railSize / 2 },
    { x: l + railSize / 2, z: w + railSize / 2 }
  ];

  postPositions.forEach(p => {
    // Structural vertical post
    const post = new THREE.Mesh(postGeo, frameMat);
    post.position.set(p.x, h / 2, p.z);
    group.add(post);

    // Top corner casting
    const topCast = new THREE.Mesh(castingGeo, castingMat);
    topCast.position.set(p.x, h + railSize / 2, p.z);
    group.add(topCast);

    // Bottom corner casting
    const botCast = new THREE.Mesh(castingGeo, castingMat);
    botCast.position.set(p.x, -railSize / 2, p.z);
    group.add(botCast);
  });

  // 4. Part 4: Top rails
  const topRailGeo = new THREE.BoxGeometry(l + 0.16, railSize, railSize);
  const topRailLeft = new THREE.Mesh(topRailGeo, frameMat);
  topRailLeft.position.set(l / 2, h + railSize / 2, -railSize / 2);
  group.add(topRailLeft);

  const topRailRight = new THREE.Mesh(topRailGeo, frameMat);
  topRailRight.position.set(l / 2, h + railSize / 2, w + railSize / 2);
  group.add(topRailRight);

  // End headers (front & rear top)
  const headerGeo = new THREE.BoxGeometry(railSize, railSize, w + railSize * 2);
  const frontHeader = new THREE.Mesh(headerGeo, frameMat);
  frontHeader.position.set(-railSize / 2, h + railSize / 2, w / 2);
  group.add(frontHeader);

  const rearHeader = new THREE.Mesh(headerGeo, frameMat);
  rearHeader.position.set(l + railSize / 2, h + railSize / 2, w / 2);
  group.add(rearHeader);

  // 5. Part 5: Side Walls (Left & Right corrugated panels)
  const sideWallGeo = new THREE.BoxGeometry(l, h, wallThickness);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
  leftWall.position.set(l / 2, h / 2, -wallThickness / 2);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightWall.position.set(l / 2, h / 2, w + wallThickness / 2);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // 6. Part 6: Front End Wall (Bulkhead panel)
  const frontWallGeo = new THREE.BoxGeometry(wallThickness, h, w);
  const frontWall = new THREE.Mesh(frontWallGeo, wallMat);
  frontWall.position.set(-wallThickness / 2, h / 2, w / 2);
  group.add(frontWall);

  // 7. Part 7: Roof Panel
  if (!isOpenTop) {
    const roofGeo = new THREE.BoxGeometry(l, wallThickness, w);
    const roofMesh = new THREE.Mesh(roofGeo, wallMat);
    roofMesh.position.set(l / 2, h + wallThickness / 2, w / 2);
    group.add(roofMesh);
  }

  // 8. Part 8: Double Rear Cargo Doors with Locking Bars
  if (doorsOpen) {
    // Open doors swinging outwards (angle ~110 degrees)
    const doorW = w / 2 - 0.02;
    const doorH = h * 0.98;
    const doorGeo = new THREE.BoxGeometry(0.04, doorH, doorW);

    const doorMat = new THREE.MeshStandardMaterial({
      color: steelPaintColor,
      roughness: 0.6,
      metalness: 0.4
    });

    // Left door pivot
    const leftDoorPivot = new THREE.Group();
    leftDoorPivot.position.set(l, 0, 0);
    leftDoorPivot.rotation.y = -Math.PI * 0.65; // swing open

    const leftDoor = new THREE.Mesh(doorGeo, doorMat);
    leftDoor.position.set(0, doorH / 2, doorW / 2);
    leftDoorPivot.add(leftDoor);

    // Locking bar on left door
    const barGeo = new THREE.CylinderGeometry(0.012, 0.012, doorH * 0.9, 8);
    const barMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.2, metalness: 0.9 });
    const barLeft = new THREE.Mesh(barGeo, barMat);
    barLeft.position.set(0.025, doorH / 2, doorW * 0.6);
    leftDoorPivot.add(barLeft);

    group.add(leftDoorPivot);

    // Right door pivot
    const rightDoorPivot = new THREE.Group();
    rightDoorPivot.position.set(l, 0, w);
    rightDoorPivot.rotation.y = Math.PI * 0.65; // swing open

    const rightDoor = new THREE.Mesh(doorGeo, doorMat);
    rightDoor.position.set(0, doorH / 2, -doorW / 2);
    rightDoorPivot.add(rightDoor);

    const barRight = new THREE.Mesh(barGeo, barMat);
    barRight.position.set(0.025, doorH / 2, -doorW * 0.6);
    rightDoorPivot.add(barRight);

    group.add(rightDoorPivot);
  }

  // 9. Part 9: Metric Grid & Measurement Ticks along Container Floor
  const gridHelper = new THREE.GridHelper(Math.max(l, w), Math.round(Math.max(l, w) * 2), 0x3b82f6, 0x1e293b);
  gridHelper.position.set(l / 2, 0.001, w / 2);
  gridHelper.material.opacity = 0.25;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  // 10. Part 10: Ground contact shadow under container
  const groundShadowGeo = new THREE.PlaneGeometry(l * 1.15, w * 1.3);
  const groundShadowMat = new THREE.MeshBasicMaterial({
    map: getSharedShadowTexture(),
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });
  const groundShadow = new THREE.Mesh(groundShadowGeo, groundShadowMat);
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.set(l / 2, -railSize - 0.005, w / 2);
  group.add(groundShadow);

  return group;
}

/**
 * Creates an interactive 3D Gyroscope Center of Gravity (CoG) marker
 * with laser plumb line to the floor and a safe balance zone box.
 */
export function createCenterOfGravityIndicator(
  cog: CenterOfGravity,
  container: ContainerDef
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cog-indicator';

  const xM = cog.xMm * MM_TO_M;
  const yM = Math.max(0.2, cog.yMm * MM_TO_M);
  const zM = cog.zMm * MM_TO_M;

  const cLengthM = container.innerLengthMm * MM_TO_M;
  const cWidthM = container.innerWidthMm * MM_TO_M;

  // Color by balance status
  const colorHex = cog.status === 'optimal'
    ? 0x10b981 // Emerald green
    : cog.status === 'warning'
      ? 0xf59e0b // Amber warning
      : 0xef4444; // Crimson danger

  // 1. Center Gyro sphere
  const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8
  });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  sphereMesh.position.set(xM, yM, zM);
  group.add(sphereMesh);

  // 2. Outer Torus Gyro Ring 1
  const torusGeo1 = new THREE.TorusGeometry(0.22, 0.015, 8, 32);
  const torusMat1 = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.9
  });
  const ring1 = new THREE.Mesh(torusGeo1, torusMat1);
  ring1.position.set(xM, yM, zM);
  ring1.rotation.x = Math.PI / 3;
  group.add(ring1);

  // 3. Inner Torus Gyro Ring 2
  const torusGeo2 = new THREE.TorusGeometry(0.17, 0.012, 8, 32);
  const ring2 = new THREE.Mesh(torusGeo2, torusMat1);
  ring2.position.set(xM, yM, zM);
  ring2.rotation.y = Math.PI / 4;
  group.add(ring2);

  // 4. Vertical laser plumb line from CoG down to container floor
  const laserH = yM;
  const laserGeo = new THREE.CylinderGeometry(0.008, 0.008, laserH, 8);
  const laserMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.85
  });
  const laser = new THREE.Mesh(laserGeo, laserMat);
  laser.position.set(xM, laserH / 2, zM);
  group.add(laser);

  // 5. Floor projection crosshair target
  const targetRingGeo = new THREE.RingGeometry(0.15, 0.2, 32);
  const targetRingMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide
  });
  const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.position.set(xM, 0.01, zM);
  group.add(targetRing);

  // 6. Safe Balance Zone (Green dashed boundary on floor between 45% and 55% of container length)
  const safeMinX = cLengthM * 0.45;
  const safeMaxX = cLengthM * 0.55;
  const safeMinZ = cWidthM * 0.47;
  const safeMaxZ = cWidthM * 0.53;
  const safeBoxGeo = new THREE.BoxGeometry(safeMaxX - safeMinX, 0.01, safeMaxZ - safeMinZ);
  const safeBoxMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    wireframe: true,
    transparent: true,
    opacity: 0.6
  });
  const safeBox = new THREE.Mesh(safeBoxGeo, safeBoxMat);
  safeBox.position.set((safeMinX + safeMaxX) / 2, 0.01, (safeMinZ + safeMaxZ) / 2);
  group.add(safeBox);

  return group;
}

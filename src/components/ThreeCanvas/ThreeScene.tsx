import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ContainerDef, PackingResult, PlacedPallet } from '../../types/logistics';
import {
  createCenterOfGravityIndicator,
  createProceduralContainerGroup,
  createProceduralPalletGroup,
  MM_TO_M
} from './proceduralModels';
import {
  createCartonTexture,
  createCorrugatedNormalTexture,
  createFloorWoodTexture,
  createPalletWoodTexture
} from './proceduralTextures';

export type CameraPreset = 'iso' | 'top' | 'side' | 'door';
export type ContainerViewMode = 'translucent' | 'solid' | 'wireframe' | 'open_top';

interface ThreeSceneProps {
  container: ContainerDef;
  packingResult: PackingResult;
  viewMode: ContainerViewMode;
  showCoG: boolean;
  doorsOpen: boolean;
  visiblePalletCount: number;
  cameraPreset: CameraPreset;
  selectedPallet: PlacedPallet | null;
  onHoverPallet: (pallet: PlacedPallet | null) => void;
  onSelectPallet: (pallet: PlacedPallet | null) => void;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  container,
  packingResult,
  viewMode,
  showCoG,
  doorsOpen,
  visiblePalletCount,
  cameraPreset,
  selectedPallet,
  onHoverPallet,
  onSelectPallet
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Group references
  const containerGroupRef = useRef<THREE.Group | null>(null);
  const palletsGroupRef = useRef<THREE.Group | null>(null);
  const cogGroupRef = useRef<THREE.Group | null>(null);

  // Procedural texture caches
  const texturesRef = useRef<{
    floor: THREE.Texture;
    palletWood: THREE.Texture;
    carton: THREE.Texture;
    corrugated: THREE.Texture;
  } | null>(null);

  // Target camera positions for smooth damping transitions
  const cameraTargetRef = useRef<{ pos: THREE.Vector3; look: THREE.Vector3; active: boolean }>({
    pos: new THREE.Vector3(10, 8, 12),
    look: new THREE.Vector3(3, 1, 1.2),
    active: false
  });

  // Reusable raycaster math objects (Zero GC in loop)
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredMeshRef = useRef<THREE.Group | null>(null);

  // Detect Software WebGL
  const isSoftwareGlRef = useRef(false);

  // 1. Initialize Scene, Renderer, Lights, and OrbitControls once
  useEffect(() => {
    if (!mountRef.current) return;
    const containerEl = mountRef.current;
    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || window.innerHeight;

    // Detect software WebGL
    const isSoftGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    isSoftwareGlRef.current = isSoftGl;

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftGl,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerEl.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create Scene with matching horizon fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f19');
    scene.fog = new THREE.FogExp2('#0b0f19', 0.022);
    sceneRef.current = scene;

    // Studio Environment map via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(9, 6.5, 10);
    cameraRef.current = camera;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // don't go below ground
    controls.minDistance = 2;
    controls.maxDistance = 45;
    controls.target.set(3, 1.2, 1.2);
    controlsRef.current = controls;

    // Cancel camera animation if user starts interacting
    controls.addEventListener('start', () => {
      cameraTargetRef.current.active = false;
    });

    // Balanced 3-Point Studio Lighting
    // 1. Warm Directional Key Light
    const keyLight = new THREE.DirectionalLight('#fff1e6', 2.4);
    keyLight.position.set(12, 15, 10);
    keyLight.castShadow = !isSoftGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    const shadowD = 10;
    keyLight.shadow.camera.left = -shadowD;
    keyLight.shadow.camera.right = shadowD;
    keyLight.shadow.camera.top = shadowD;
    keyLight.shadow.camera.bottom = -shadowD;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // 2. Cool Sky / Ground Hemisphere Light Fill
    const hemiLight = new THREE.HemisphereLight('#67e8f9', '#0f172a', 1.0);
    scene.add(hemiLight);

    // 3. Subtle Rim / Door Light
    const rimLight = new THREE.DirectionalLight('#93c5fd', 0.8);
    rimLight.position.set(-8, 6, -6);
    scene.add(rimLight);

    // Generate procedural textures
    texturesRef.current = {
      floor: createFloorWoodTexture(),
      palletWood: createPalletWoodTexture(),
      carton: createCartonTexture('CARGO / FRAGILE'),
      corrugated: createCorrugatedNormalTexture()
    };

    // Pallets group container
    const palletsGroup = new THREE.Group();
    palletsGroup.name = 'pallets-container-group';
    scene.add(palletsGroup);
    palletsGroupRef.current = palletsGroup;

    // Animation & Render Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera preset smooth transition interpolation
      if (cameraTargetRef.current.active && camera && controls) {
        const factor = 1 - Math.exp(-4 * delta);
        camera.position.lerp(cameraTargetRef.current.pos, factor);
        controls.target.lerp(cameraTargetRef.current.look, factor);

        if (
          camera.position.distanceTo(cameraTargetRef.current.pos) < 0.05 &&
          controls.target.distanceTo(cameraTargetRef.current.look) < 0.05
        ) {
          cameraTargetRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!containerEl || !renderer || !camera) return;
      const newW = containerEl.clientWidth;
      const newH = containerEl.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Pointer move for Raycasting pallet hover
    const handlePointerMove = (e: MouseEvent) => {
      const rect = containerEl.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current || !palletsGroupRef.current) return;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(palletsGroupRef.current.children, true);

      let foundPallet: PlacedPallet | null = null;
      let matchedGroup: THREE.Group | null = null;

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== palletsGroupRef.current) {
          if (cur.userData && cur.userData.isPallet) {
            foundPallet = cur.userData.palletData as PlacedPallet;
            matchedGroup = cur as THREE.Group;
            break;
          }
          cur = cur.parent;
        }
        if (foundPallet) break;
      }

      if (hoveredMeshRef.current !== matchedGroup) {
        hoveredMeshRef.current = matchedGroup;
        onHoverPallet(foundPallet);
      }
    };

    // Click on pallet
    const handleClick = (e: MouseEvent) => {
      const rect = containerEl.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current || !palletsGroupRef.current) return;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(palletsGroupRef.current.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== palletsGroupRef.current) {
          if (cur.userData && cur.userData.isPallet) {
            onSelectPallet(cur.userData.palletData as PlacedPallet);
            return;
          }
          cur = cur.parent;
        }
      }
    };

    containerEl.addEventListener('pointermove', handlePointerMove);
    containerEl.addEventListener('click', handleClick);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      containerEl.removeEventListener('pointermove', handlePointerMove);
      containerEl.removeEventListener('click', handleClick);

      renderer.dispose();
      if (renderer.domElement && containerEl.contains(renderer.domElement)) {
        containerEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. Re-create Container procedural model when container definition or viewMode / doorsOpen change
  useEffect(() => {
    const scene = sceneRef.current;
    const textures = texturesRef.current;
    if (!scene || !textures) return;

    if (containerGroupRef.current) {
      scene.remove(containerGroupRef.current);
      containerGroupRef.current.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
        }
      });
      containerGroupRef.current = null;
    }

    const containerGroup = createProceduralContainerGroup(
      container,
      textures.floor,
      textures.corrugated,
      viewMode,
      doorsOpen
    );
    scene.add(containerGroup);
    containerGroupRef.current = containerGroup;

    // Adjust camera target look position to center of container
    const cL = container.innerLengthMm * MM_TO_M;
    const cW = container.innerWidthMm * MM_TO_M;
    const cH = container.innerHeightMm * MM_TO_M;

    if (controlsRef.current) {
      controlsRef.current.target.set(cL / 2, cH / 2, cW / 2);
    }
  }, [container, viewMode, doorsOpen]);

  // 3. Re-build Pallets models when packingResult changes or visible count updates
  useEffect(() => {
    const scene = sceneRef.current;
    const palletsGroup = palletsGroupRef.current;
    const textures = texturesRef.current;
    if (!scene || !palletsGroup || !textures) return;

    // Clear old pallets
    while (palletsGroup.children.length > 0) {
      const child = palletsGroup.children[0];
      palletsGroup.remove(child);
      child.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry?.dispose();
        }
      });
    }

    // Limit to visible pallet count for animation sequence
    const palletsToRender = packingResult.placedPallets.slice(0, visiblePalletCount);

    palletsToRender.forEach(p => {
      const isSelected = selectedPallet?.id === p.id;
      const palletGroup = createProceduralPalletGroup(
        {
          ...p,
          color: isSelected ? '#f59e0b' : p.color
        },
        textures.palletWood,
        textures.carton
      );
      palletsGroup.add(palletGroup);
    });
  }, [packingResult, visiblePalletCount, selectedPallet]);

  // 4. Update Center of Gravity (CoG) 3D Marker
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (cogGroupRef.current) {
      scene.remove(cogGroupRef.current);
      cogGroupRef.current = null;
    }

    if (showCoG && packingResult.placedPallets.length > 0) {
      const cogGroup = createCenterOfGravityIndicator(packingResult.centerOfGravity, container);
      scene.add(cogGroup);
      cogGroupRef.current = cogGroup;
    }
  }, [packingResult.centerOfGravity, container, showCoG, packingResult.placedPallets.length]);

  // 5. Smooth Camera Preset transitions
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const cL = container.innerLengthMm * MM_TO_M;
    const cW = container.innerWidthMm * MM_TO_M;
    const cH = container.innerHeightMm * MM_TO_M;
    const center = new THREE.Vector3(cL / 2, cH / 2, cW / 2);

    let targetPos = new THREE.Vector3();

    switch (cameraPreset) {
      case 'iso':
        targetPos.set(cL * 1.25 + 3, cH * 1.8 + 2, cW * 2.2 + 2);
        break;
      case 'top':
        targetPos.set(cL / 2, cH + Math.max(cL, cW) * 0.95, cW / 2 + 0.01);
        break;
      case 'side':
        targetPos.set(cL / 2, cH / 2 + 0.5, cW + Math.max(cL * 0.65, 6));
        break;
      case 'door':
        // View looking straight inside from container doors at rear
        targetPos.set(cL + 3.5, cH * 0.5, cW / 2);
        break;
    }

    cameraTargetRef.current = {
      pos: targetPos,
      look: center,
      active: true
    };
  }, [cameraPreset, container]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full select-none cursor-grab active:cursor-grabbing outline-none"
    />
  );
};

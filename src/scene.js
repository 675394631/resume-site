import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const COLOR = {
  ink: 0x10162a, blue: 0x8b9dff, violet: 0xb7a0fb,
  peach: 0xffad8f, mint: 0xbce5dc, ice: 0xe9edff,
};

/** A procedural, asset-free portfolio exhibition. All controls remain in the host UI. */
export function initScene(container, { onModeChange, initialMode = 'ai', paused: initialPaused, suspended: initialSuspended = false } = {}) {
  const noop = () => {};
  const fallbackAPI = { setMode: noop, setPaused: noop, setSuspended: noop, resetView: noop, dispose: noop, getStats: () => ({ renderCount: 0, drawCalls: 0, triangles: 0, geometries: 0, loadedModes: [], dpr: 1, paused: true, suspended: Boolean(initialSuspended) }) };
  if (!container) return fallbackAPI;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch {
    container.dataset.sceneReady = 'fallback';
    const message = document.createElement('p');
    message.className = 'scene-fallback';
    message.textContent = '三维场景暂不可用，继续向下探索项目与经历。';
    container.append(message);
    return { ...fallbackAPI, dispose: () => message.remove() };
  }

  renderer.setPixelRatio(1);
  renderer.setClearColor(0x16294a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;outline:none;';
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);

  // Post-processing pipeline
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.2, 0.6
  );
  composer.addPass(bloomPass);
  const colorPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uSat: { value: 0.15 },
      uCon: { value: 0.08 },
      uLift: { value: 0.02 },
    },
    vertexShader: 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse;\nuniform float uSat, uCon, uLift;\nvarying vec2 vUv;\nvoid main() {\n  vec3 c = texture2D(tDiffuse, vUv).rgb;\n  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));\n  c = mix(vec3(l), c, 1.0 + uSat);\n  float wl = smoothstep(0.03, 0.16, l) * (1.0 - smoothstep(0.34, 0.72, l));\n  c += uLift * wl;\n  float w = 1.0 - smoothstep(0.55, 0.92, l);\n  c = (c - 0.5) * (1.0 + uCon * w) + 0.5;\n  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);\n}',
  });
  composer.addPass(colorPass);
  composer.addPass(new OutputPass());
  const initialCamera = new THREE.Vector3(14, 10, 20);
  camera.position.copy(initialCamera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.1, 0);
  // Direct manipulation needs no idle damping loop and stops immediately after a gesture.
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.enableRotate = true;
  // Scrolling the résumé should keep working; zoom is available with touch pinch.
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.minDistance = 3;
  controls.maxDistance = 120;
  controls.minPolarAngle = Math.PI * 0.14;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.update();
  renderer.domElement.style.touchAction = 'manipulation';

  // Direct lights avoid environment-map generation and screen-space refraction passes.
  // Multi-color key/fill lighting matching reference quality
  scene.add(new THREE.AmbientLight(0x2a3a5c, 1.1));
  scene.add(new THREE.HemisphereLight(0x8eaacc, 0x1a2840, 0.9));

  const key1 = new THREE.DirectionalLight(0xfff4e6, 5.5);
  key1.position.set(-120, 150, 95);
  scene.add(key1);

  const key2 = new THREE.DirectionalLight(0xd0e0ff, 3.2);
  key2.position.set(160, 92, -120);
  scene.add(key2);

  const fill1 = new THREE.DirectionalLight(0xc8d8ff, 2.0);
  fill1.position.set(40, 60, 190);
  scene.add(fill1);

  const fill2 = new THREE.DirectionalLight(0xffe8d0, 1.2);
  fill2.position.set(-90, 40, -160);
  scene.add(fill2);

  const bottom = new THREE.DirectionalLight(0x8098c0, 0.6);
  bottom.position.set(0, -30, 40);
  scene.add(bottom);

  const geometryCache = new Map();
  const materialCache = new Map();
  const geometry = (key, create) => {
    if (!geometryCache.has(key)) geometryCache.set(key, create());
    return geometryCache.get(key);
  };
  const standard = (color, options = {}) => {
    const key = `standard:${color}:${JSON.stringify(options)}`;
    if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.12, ...options }));
    return materialCache.get(key);
  };
  // Alpha blending provides the tinted-pane appearance in the normal render pass.
  const glass = (color, opacity = 0.64) => standard(color, {
    metalness: 0.05, roughness: 0.28, emissive: color, emissiveIntensity: 0.1,
    transparent: true, opacity, depthWrite: false,
  });
  const glow = (color, intensity = 1.4) => standard(color, { emissive: color, emissiveIntensity: intensity, metalness: 0.05, roughness: 0.3 });
  const rounded = (parent, size, position, material, radius = 0.12) => {
    const mesh = new THREE.Mesh(geometry(`box:${size.join(',')}:${radius}`, () => new RoundedBoxGeometry(...size, 1, radius)), material);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  };
  const sphere = (parent, radius, position, material, detail = 16) => {
    const segments = radius < 0.09 ? 8 : Math.min(detail, 16);
    const rings = radius < 0.09 ? 5 : 8;
    const mesh = new THREE.Mesh(geometry(`sphere:${radius}:${segments}:${rings}`, () => new THREE.SphereGeometry(radius, segments, rings)), material);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  };
  const line = (parent, points, color, opacity = 0.6) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(points.length === 2 ? 1 : 20));
    const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    parent.add(mesh);
    return { mesh, curve };
  };
  const tube = (parent, points, color, radius = 0.016) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 4, false), glow(color, 0.7));
    parent.add(mesh);
    return { mesh, curve };
  };
  const ring = (parent, radius, tubeRadius, material, position = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry(`ring:${radius}:${tubeRadius}`, () => new THREE.TorusGeometry(radius, tubeRadius, 4, 40)), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  };
  const strokeRect = (parent, width, depth, y, color, opacity = 0.7) => {
    const x = width / 2, z = depth / 2, r = 0.18;
    const curve = new THREE.CatmullRomCurve3([
      [-x + r, y, -z], [x - r, y, -z], [x, y, -z + r], [x, y, z - r],
      [x - r, y, z], [-x + r, y, z], [-x, y, z - r], [-x, y, -z + r],
    ].map(p => new THREE.Vector3(...p)), true, 'centripetal');
    const result = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    parent.add(result);
    return result;
  };

  const makeRoot = () => {
    const root = new THREE.Group();
    const object = new THREE.Group();
    root.add(object);
    scene.add(root);
    return { root, object, value: 0, target: 0, update: noop };
  };

  function createAI() {
    const item = makeRoot();
    const { object } = item;
    const layers = [];
    for (let i = 0; i < 4; i++) {
      const layer = new THREE.Group();
      layer.position.y = -1.15 + i * 0.76;
      layer.rotation.y = (i - 1.5) * 0.14;
      const width = 3.08 - i * 0.05;
      const layerMaterial = glass(i % 2 ? 0x6650b6 : 0x354db0, i === 0 ? 0.86 : 0.54);
      if (i === 0) rounded(layer, [width, 0.14, width], [0, 0, 0], layerMaterial, 0.09);
      else {
        // The open center exposes the physical core instead of burying it under
        // successive tinted panes. The aperture also reads as a manufactured part.
        const half = width / 2, r = 0.12;
        const plateShape = new THREE.Shape();
        plateShape.moveTo(-half + r, -half);
        plateShape.lineTo(half - r, -half);
        plateShape.quadraticCurveTo(half, -half, half, -half + r);
        plateShape.lineTo(half, half - r);
        plateShape.quadraticCurveTo(half, half, half - r, half);
        plateShape.lineTo(-half + r, half);
        plateShape.quadraticCurveTo(-half, half, -half, half - r);
        plateShape.lineTo(-half, -half + r);
        plateShape.quadraticCurveTo(-half, -half, -half + r, -half);
        const aperture = new THREE.Path();
        aperture.absarc(0, 0, 0.73, 0, Math.PI * 2, true);
        plateShape.holes.push(aperture);
        const plateGeometry = new THREE.ExtrudeGeometry(plateShape, { depth: 0.11, steps: 1, bevelEnabled: true, bevelSegments: 1, bevelThickness: 0.015, bevelSize: 0.015, curveSegments: 12 });
        plateGeometry.rotateX(-Math.PI / 2);
        plateGeometry.translate(0, -0.055, 0);
        layer.add(new THREE.Mesh(plateGeometry, layerMaterial));
        ring(layer, 0.74, 0.008, glow(i === 2 ? COLOR.peach : COLOR.blue, 0.45), [0, 0.06, 0]);
      }
      strokeRect(layer, width - 0.08, width - 0.08, 0.075, i % 2 ? COLOR.violet : COLOR.blue, 0.85);
      for (let n = 0; n < 3; n++) {
        sphere(layer, 0.03, [-1.2 + n * 0.13, 0.084, 1.18], glow(n === 0 ? COLOR.mint : COLOR.blue, 1));
      }
      // Fine etched circuit tracks remain subordinate to the solid sculpture.
      [-1, 1].forEach(side => {
        line(layer, [[side * 1.22, 0.082, -1.18], [side * 1.22, 0.082, -0.6], [side * 0.92, 0.082, -0.34]], COLOR.ice, 0.34);
        line(layer, [[side * 0.4, 0.082, 1.23], [side * 0.85, 0.082, 1.23], [side * 1.2, 0.082, 0.84]], COLOR.ice, 0.34);
      });
      if (i === 0) {
        rounded(layer, [1.5, 0.13, 1.5], [0, 0.1, 0], standard(COLOR.ink), 0.09);
        rounded(layer, [1.25, 0.06, 1.25], [0, 0.195, 0], glow(COLOR.blue, 0.65), 0.05);
      }
      object.add(layer);
      layers.push(layer);
    }
    const core = new THREE.Group();
    core.position.y = 0.07;
    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.57, 1), new THREE.MeshStandardMaterial({
      color: 0xff7c42, roughness: 0.22, metalness: 0.15, emissive: 0xff4218, emissiveIntensity: 0.82,
    }));
    // Keep the emitter legible through the display's translucent optical layers.
    coreMesh.material.transparent = true;
    coreMesh.renderOrder = 4;
    core.add(coreMesh);
    // A tiny generated sprite gives the compute core a warm optical bloom without
    // a fullscreen postprocessing pipeline or an external bitmap dependency.
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = haloCanvas.height = 96;
    const haloContext = haloCanvas.getContext('2d');
    const gradient = haloContext.createRadialGradient(48, 48, 3, 48, 48, 48);
    gradient.addColorStop(0, 'rgba(255, 130, 62, 0.72)');
    gradient.addColorStop(0.27, 'rgba(255, 106, 49, 0.38)');
    gradient.addColorStop(0.6, 'rgba(242, 73, 32, 0.12)');
    gradient.addColorStop(1, 'rgba(235, 60, 30, 0)');
    haloContext.fillStyle = gradient;
    haloContext.fillRect(0, 0, 96, 96);
    const haloTexture = new THREE.CanvasTexture(haloCanvas);
    const coreBloom = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, color: 0xffb78b, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending, depthWrite: false }));
    coreBloom.scale.set(2.1, 2.1, 1);
    core.add(coreBloom);
    const coreCage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.73, 1), new THREE.MeshBasicMaterial({ color: COLOR.peach, wireframe: true, transparent: true, opacity: 0.27 }));
    coreCage.renderOrder = 5;
    core.add(coreCage);
    const a = ring(core, 0.98, 0.022, glow(COLOR.peach, 0.9));
    a.rotation.set(0.85, 0.18, -0.3);
    a.material.transparent = true;
    a.renderOrder = 6;
    const b = ring(core, 1.04, 0.009, glow(COLOR.ice, 0.6));
    b.rotation.set(-0.54, 0.65, 0.2);
    b.material.transparent = true;
    b.renderOrder = 6;
    object.add(core);
    const halo = ring(object, 2.3, 0.006, new THREE.MeshBasicMaterial({ color: COLOR.blue, transparent: true, opacity: 0.23 }), [0, -0.4, 0]);
    halo.rotation.set(1.14, 0.08, 0.1);
    const halo2 = ring(object, 2.38, 0.003, new THREE.MeshBasicMaterial({ color: COLOR.blue, transparent: true, opacity: 0.12 }), [0, -0.4, 0]);
    halo2.rotation.copy(halo.rotation);
    const dots = [];
    for (let i = 0; i < 8; i++) {
      const dot = sphere(object, i % 2 ? 0.035 : 0.05, [0, 0, 0], glow(i % 3 ? COLOR.mint : COLOR.peach, 1.3), 12);
      dots.push(dot);
    }
    // Pin bundles connect the compute stack without visually filling its gaps.
    for (const [x, z] of [[-1.14, -0.92], [1.14, 0.92]]) {
      line(object, [[x, -1.16, z], [x, 0, z], [x, 1.16, z]], COLOR.mint, 0.28);
    }
    item.update = t => {
      object.position.y = Math.sin(t * 0.65) * 0.11;
      object.rotation.y = -0.3 + Math.sin(t * 0.23) * 0.13;
      coreMesh.rotation.set(t * 0.18, t * 0.22, 0.12);
      coreBloom.material.opacity = 0.47 + Math.sin(t * 1.4) * 0.06;
      coreCage.rotation.set(-t * 0.11, t * 0.13, 0.3);
      a.rotation.z = -0.3 + t * 0.12;
      b.rotation.y = 0.65 - t * 0.15;
      layers.forEach((layer, i) => { layer.position.y = -1.15 + i * 0.76 + Math.sin(t * 0.65 + i * 0.5) * 0.025; });
      dots.forEach((dot, i) => {
        const angle = i * Math.PI * 0.25 + t * 0.23;
        const y = ((t * 0.22 + i / dots.length) % 1) * 2.6 - 1.3;
        dot.position.set(Math.cos(angle) * 1.79, y, Math.sin(angle) * 1.79);
      });
    };
    return item;
  }

  function createCanvas() {
    const item = makeRoot();
    const { object } = item;
    object.rotation.y = 0.6;
    const panels = [];
    function panel(x, y, z, width, height, tint, variant) {
      const p = new THREE.Group();
      p.position.set(x, y, z);
      rounded(p, [width, height, 0.12], [0, 0, 0], glass(tint, 0.83), 0.08);
      rounded(p, [width - 0.12, 0.035, 0.045], [0, height / 2 - 0.06, 0.07], glow(tint, 0.7), 0.015);
      [-1, 0, 1].forEach((a, i) => sphere(p, 0.022, [-width / 2 + 0.15 + i * 0.09, height / 2 - 0.19, 0.088], glow(a === -1 ? COLOR.peach : COLOR.ice, 0.4), 12));
      const blockMat = standard(COLOR.ice, { transparent: true, opacity: 0.62 });
      if (variant === 'prompt') {
        for (let i = 0; i < 4; i++) {
          const w = (width - 0.34) * [0.91, 0.69, 0.96, 0.53][i];
          rounded(p, [w, 0.038, 0.035], [-width / 2 + 0.17 + w / 2, height / 2 - 0.45 - i * 0.15, 0.083], blockMat, 0.01);
        }
        rounded(p, [0.52, 0.17, 0.04], [width / 2 - 0.43, -height / 2 + 0.21, 0.085], glow(COLOR.mint, 0.4), 0.035);
      } else if (variant === 'image') {
        rounded(p, [width - 0.3, height - 0.48, 0.04], [0, -0.1, 0.09], standard(0x171d3f, { roughness: 0.45 }), 0.045);
        const art = new THREE.Group();
        const orb = sphere(art, Math.min(width, height) * 0.22, [0, 0, 0], standard(COLOR.peach, { roughness: 0.22, metalness: 0.1 }));
        const hoop = ring(art, Math.min(width, height) * 0.32, 0.033, glow(COLOR.violet, 0.55));
        hoop.rotation.set(0.65, 0.1, -0.38);
        art.position.set(0, -0.08, 0.15);
        p.add(art);
        p.userData.art = art;
        p.userData.orb = orb;
      } else {
        for (let i = 0; i < 8; i++) {
          const barHeight = 0.1 + (Math.sin(i * 1.17) + 1) * 0.14;
          rounded(p, [0.07, barHeight, 0.04], [-0.49 + i * 0.14, -0.04, 0.1], glow(i < 4 ? COLOR.mint : COLOR.blue, 0.5), 0.025);
        }
        rounded(p, [width - 0.45, 0.025, 0.035], [0, -height / 2 + 0.22, 0.086], blockMat, 0.01);
      }
      sphere(p, 0.064, [-width / 2 - 0.02, 0, 0.04], glow(tint, 0.7), 16);
      sphere(p, 0.064, [width / 2 + 0.02, 0, 0.04], glow(tint, 0.7), 16);
      object.add(p);
      panels.push({ p, x, y, z });
      return p;
    }
    panel(-1.81, 0.82, -0.28, 1.65, 1.25, COLOR.blue, 'prompt');
    panel(-1.75, -0.94, 0.05, 1.8, 1.24, COLOR.mint, 'audio');
    panel(0.62, 0.26, 0.46, 2.24, 2.13, COLOR.violet, 'image');
    panel(2.2, -1.23, -0.2, 1.4, 1.02, COLOR.peach, 'image');
    const wires = [
      tube(object, [[-0.96, 0.82, -0.24], [-0.63, 0.81, -0.2], [-0.64, 0.26, 0.45], [-0.52, 0.26, 0.5]], COLOR.blue, 0.012),
      tube(object, [[-0.82, -0.94, 0.09], [-0.3, -0.94, 0.12], [-0.4, 0.26, 0.46], [-0.52, 0.26, 0.5]], COLOR.mint, 0.012),
      tube(object, [[1.76, 0.26, 0.5], [2.94, 0.14, 0.32], [3, -1.2, -0.16], [2.92, -1.23, -0.16]], COLOR.peach, 0.012),
    ];
    const flows = wires.map((w, i) => ({ ...w, dot: sphere(object, 0.04, [0, 0, 0], glow([COLOR.blue, COLOR.mint, COLOR.peach][i], 1.5), 12) }));
    // A restrained three-dimensional canvas grid gives the nodes a shared space.
    const gridPoints = [];
    for (let x = -3; x <= 3; x += 0.38) {
      for (let y = -2; y <= 2; y += 0.38) gridPoints.push(x, y, -0.55);
    }
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    const grid = new THREE.Points(gridGeometry, new THREE.PointsMaterial({ color: COLOR.blue, size: 0.023, transparent: true, opacity: 0.28 }));
    object.add(grid);
    item.update = t => {
      object.rotation.y = 0.61 + Math.sin(t * 0.18) * 0.08;
      object.position.y = Math.sin(t * 0.55) * 0.07;
      panels.forEach(({ p, y }, i) => {
        p.position.y = y + Math.sin(t * 0.7 + i) * 0.025;
        if (p.userData.art) p.userData.art.rotation.y = Math.sin(t * 0.65 + i) * 0.2;
      });
      flows.forEach(({ curve, dot }, i) => dot.position.copy(curve.getPoint((t * 0.2 + i * 0.3) % 1)));
    };
    return item;
  }

  function createEnergy() {
    const item = makeRoot();
    const { object } = item;

    // Match reference: dark blue background, ground grid
    const gridHelper = new THREE.PolarGridHelper(38, 48, 24, 128, 0x1b3a5c, 0x1b3a5c);
    gridHelper.position.y = -3.5;
    object.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1f33,
      roughness: 0.85,
      metalness: 0.05,
      depthWrite: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.6;
    ground.receiveShadow = true;
    object.add(ground);

    // Crosshair circles at center
    for (let r of [8, 18, 32]) {
      const ringGeo = new THREE.TorusGeometry(r, 0.12, 8, 80);
      const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: 0x1b3a5c, transparent: true, opacity: 0.25, depthWrite: false,
      }));
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -3.48;
      object.add(ringMesh);
    }

    // Load GLB campus model with reference-style camera positioning
    const modelGroup = new THREE.Group();
    object.add(modelGroup);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    let modelReady = false;

    gltfLoader.load('./assets/energy-campus.glb',
      (gltf) => {
        modelReady = true;
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const s = 12 / Math.max(maxDim, 0.01);
        modelGroup.scale.setScalar(s);
        const center = box.getCenter(new THREE.Vector3());
        modelGroup.position.set(-center.x * s, -box.min.y * s + 0.8, -center.z * s);
        modelGroup.add(gltf.scene);

        // Holographic glow: make HOLO_ materials ethereal
        gltf.scene.traverse((node) => {
          if (!node.name || !node.material) return;
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((mat) => {
            const n = node.name || '';
            if (n.startsWith('HOLO_')) {
              mat.transparent = true;
              mat.opacity = 0.48;
              mat.blending = THREE.AdditiveBlending;
              mat.depthWrite = false;
              if (mat.emissive) mat.emissiveIntensity = 1.8;
            }
            if (n.startsWith('HOLO_Grid') || n.startsWith('HOLO_Gnd')) {
              mat.transparent = true;
              mat.opacity = 0.3;
              mat.depthWrite = false;
            }
          });
        });
      },
      undefined,
      (err) => console.error('Campus model load error:', err)
    );

    item.update = t => {
      object.rotation.y = Math.sin(t * 0.08) * 0.08;
      if (modelReady) modelGroup.rotation.y += 0.002;
    };
    return item;
  }

  const factories = { ai: createAI, canvas: createCanvas, energy: createEnergy };
  const modes = Object.create(null);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = initialPaused === undefined ? motionQuery.matches : Boolean(initialPaused);
  let pauseWasSet = initialPaused !== undefined;
  let suspended = Boolean(initialSuspended);
  let reducedMotion = motionQuery.matches;
  let inView = false;
  let contextAvailable = true;
  let disposed = false;
  let frameId = 0;
  let timerId = 0;
  let rendering = false;
  let elapsed = 0;
  let lastTick = 0;
  let lastRendered = 0;
  let renderCount = 0;
  let dirty = true;
  let currentMode = Object.hasOwn(factories, initialMode) ? initialMode : 'ai';
  const FRAME_INTERVAL = 1000 / 30;
  const ensureMode = mode => {
    if (!modes[mode]) modes[mode] = factories[mode]();
    return modes[mode];
  };
  const first = ensureMode(currentMode);
  first.value = first.target = 1;
  first.update(0);
  container.dataset.sceneMode = currentMode;
  controls.enabled = !suspended;

  const canRender = () => !disposed && contextAvailable && !suspended && inView && !document.hidden;
  const hasTransition = () => Object.values(modes).some(item => Math.abs(item.value - item.target) > 0.001);
  function cancelPending() {
    if (timerId) clearTimeout(timerId);
    if (frameId) cancelAnimationFrame(frameId);
    timerId = frameId = 0;
    lastTick = 0;
  }
  // This is the only requestAnimationFrame entry point. Controls never update
  // inside render(), so their synchronous change events cannot fork render loops.
  function queueFrame() {
    if (!canRender() || rendering || frameId || timerId) return;
    const delay = Math.max(0, FRAME_INTERVAL - (performance.now() - lastRendered));
    timerId = window.setTimeout(() => {
      timerId = 0;
      if (canRender() && !frameId) frameId = requestAnimationFrame(render);
    }, delay);
  }
  function invalidate() {
    dirty = true;
    queueFrame();
  }
  function render(now) {
    frameId = 0;
    if (!canRender()) { lastTick = 0; return; }
    rendering = true;
    const dt = Math.min(lastTick ? (now - lastTick) / 1000 : FRAME_INTERVAL / 1000, 0.1);
    lastTick = now;
    if (!paused) elapsed += dt;
    for (const item of Object.values(modes)) {
      if (Math.abs(item.value - item.target) > 0.001 && !paused && !reducedMotion) {
        item.value = THREE.MathUtils.lerp(item.value, item.target, 1 - Math.exp(-dt * 9));
      } else item.value = item.target;
      item.root.visible = item.value > 0.001;
      const scale = Math.max(0.001, item.value);
      item.root.scale.setScalar(scale);
      item.root.position.y = (1 - scale) * -0.8;
      item.root.rotation.y = (1 - scale) * -0.35;
      if (item.root.visible) item.update(elapsed);
    }
    try {
      if (dirty || !paused) {
        composer.render();
        renderCount++;
        lastRendered = now;
        if (container.dataset.sceneReady !== 'true') container.dataset.sceneReady = 'true';
        dirty = false;
      }
    } finally {
      rendering = false;
    }
    if (canRender() && (!paused || hasTransition())) queueFrame();
    else lastTick = 0;
  }
  const onControlChange = () => { dirty = true; if (!rendering) queueFrame(); };
  controls.addEventListener('change', onControlChange);
  // Preserve normal document scrolling; direct dragging and pinch zoom remain available.
  if (controls._onMouseWheel) renderer.domElement.removeEventListener('wheel', controls._onMouseWheel);

  const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
  function resize() {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const mobile = window.matchMedia('(max-width: 767px)').matches || window.matchMedia('(pointer: coarse)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowMemory ? 1 : mobile ? 1.25 : 1.5));
    camera.aspect = width / height;
    camera.fov = camera.aspect < 1 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(36 / 2)) / camera.aspect)) : 36;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    invalidate();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersection = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting && entries[0].intersectionRatio > 0;
    if (inView) invalidate();
    else cancelPending();
  }, { rootMargin: '0px', threshold: 0 });
  intersection.observe(container);
  const visibilityChanged = () => {
    if (document.hidden) cancelPending();
    else invalidate();
  };
  document.addEventListener('visibilitychange', visibilityChanged);
  const onMotionPreference = event => {
    reducedMotion = event.matches;
    if (reducedMotion) paused = true;
    else if (!pauseWasSet) paused = false;
    cancelPending();
    invalidate();
  };
  motionQuery.addEventListener('change', onMotionPreference);
  const contextLost = event => {
    event.preventDefault();
    contextAvailable = false;
    controls.enabled = false;
    cancelPending();
    container.dataset.sceneReady = 'fallback';
  };
  const contextRestored = () => {
    contextAvailable = true;
    controls.enabled = !suspended;
    invalidate();
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  container.dataset.sceneReady = 'loading';
  resize();

  return {
    setMode(mode) {
      if (!Object.hasOwn(factories, mode) || disposed || mode === currentMode) return;
      ensureMode(mode);
      currentMode = mode;
      Object.entries(modes).forEach(([key, item]) => { item.target = key === mode ? 1 : 0; });
      container.dataset.sceneMode = mode;
      onModeChange?.(mode);
      invalidate();
    },
    setPaused(value) {
      if (disposed) return;
      pauseWasSet = true;
      paused = Boolean(value);
      if (paused) {
        cancelPending();
        // A mode change may need one final still frame; idle pause creates no RAF.
        if (hasTransition()) invalidate();
      } else invalidate();
    },
    setSuspended(value) {
      if (disposed) return;
      suspended = Boolean(value);
      controls.enabled = !suspended && contextAvailable;
      if (suspended) cancelPending();
      else invalidate();
    },
    resetView() {
      if (disposed) return;
      camera.position.copy(initialCamera);
      controls.target.set(0, 0.1, 0);
      controls.update();
      invalidate();
    },
    getStats() {
      return {
        renderCount,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        loadedModes: Object.keys(modes),
        dpr: renderer.getPixelRatio(),
        paused,
        suspended,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelPending();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      motionQuery.removeEventListener('change', onMotionPreference);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      const geometries = new Set(geometryCache.values());
      const materials = new Set(materialCache.values());
      const textures = new Set();
      scene.traverse(node => {
        if (node.geometry) geometries.add(node.geometry);
        if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
      });
      geometries.forEach(item => item.dispose());
      materials.forEach(material => {
        if (material.map) textures.add(material.map);
        material.dispose();
      });
      textures.forEach(texture => texture.dispose());
      geometryCache.clear();
      materialCache.clear();
      Object.keys(modes).forEach(mode => delete modes[mode]);
      scene.clear();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      delete container.dataset.sceneReady;
    },
  };
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { nodes, edges, nodeMeshes, edgeLines, simRunning, setSimRunning } from './state.js';

export let scene, camera, renderer, labelRenderer, controls, stars;

export function initialize() {
  const container = document.getElementById('webgl-canvas');
  const labelContainer = document.getElementById('label-canvas');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(25, 15, 30);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  labelContainer.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 120;

  // Lights
  const ambient = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0x8888ff, 1.5);
  dirLight.position.set(20, 30, 20);
  scene.add(dirLight);
  const dirLight2 = new THREE.DirectionalLight(0xff4488, 0.6);
  dirLight2.position.set(-20, -10, -30);
  scene.add(dirLight2);
  const pointLight = new THREE.PointLight(0x3b82f6, 0.5, 50);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  // Stars
  stars = createStars();

  window.addEventListener('resize', onResize);
}

function createStars() {
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.cos(phi);
    positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const c = 0.4 + Math.random() * 0.6;
    colors[i*3] = c * (0.8 + Math.random() * 0.2);
    colors[i*3+1] = c * (0.8 + Math.random() * 0.2);
    colors[i*3+2] = c;
    sizes[i] = 0.5 + Math.random() * 1.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({
    size: 0.4, vertexColors: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  return stars;
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
}

export function simulateForces() {
  if (!simRunning || nodes.size < 2) return;

  const nodeList = Array.from(nodes.values());

  for (const n of nodeList) { n.fx = 0; n.fy = 0; n.fz = 0; }

  // Repulsion
  const repulsion = 80;
  for (let i = 0; i < nodeList.length; i++) {
    for (let j = i + 1; j < nodeList.length; j++) {
      const a = nodeList[i], b = nodeList[j];
      let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < 0.01) {
        dx = (Math.random() - 0.5) * 0.1;
        dy = (Math.random() - 0.5) * 0.1;
        dz = (Math.random() - 0.5) * 0.1;
        dist = 0.1;
      }
      const force = repulsion / (dist * dist + 0.1);
      const fx = (dx/dist) * force, fy = (dy/dist) * force, fz = (dz/dist) * force;
      a.fx -= fx; a.fy -= fy; a.fz -= fz;
      b.fx += fx; b.fy += fy; b.fz += fz;
    }
  }

  // Spring attraction along edges
  const springK = 0.008, restLength = 4;
  for (const edge of edges) {
    const a = nodes.get(edge.source), b = nodes.get(edge.target);
    if (!a || !b) continue;
    let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.01;
    const displacement = dist - restLength;
    const force = springK * displacement;
    const fx = (dx/dist) * force, fy = (dy/dist) * force, fz = (dz/dist) * force;
    a.fx += fx; a.fy += fy; a.fz += fz;
    b.fx -= fx; b.fy -= fy; b.fz -= fz;
  }

  // Center gravity & apply
  const centerGravity = 0.003, damping = 0.92, maxVelocity = 3, minVelocity = 0.001;
  for (const n of nodeList) {
    n.fx -= n.x * centerGravity;
    n.fy -= n.y * centerGravity;
    n.fz -= n.z * centerGravity;
    n.vx = (n.vx || 0) + n.fx;
    n.vy = (n.vy || 0) + n.fy;
    n.vz = (n.vz || 0) + n.fz;
    const speed = Math.sqrt(n.vx*n.vx + n.vy*n.vy + n.vz*n.vz);
    if (speed > maxVelocity) {
      n.vx = (n.vx/speed) * maxVelocity;
      n.vy = (n.vy/speed) * maxVelocity;
      n.vz = (n.vz/speed) * maxVelocity;
    }
    n.vx *= damping; n.vy *= damping; n.vz *= damping;
    if (Math.abs(n.vx) < minVelocity) n.vx = 0;
    if (Math.abs(n.vy) < minVelocity) n.vy = 0;
    if (Math.abs(n.vz) < minVelocity) n.vz = 0;
    n.x += n.vx; n.y += n.vy; n.z += n.vz;
  }

  // Update 3D positions
  for (const [id, obj] of nodeMeshes) {
    const n = nodes.get(id);
    if (!n) continue;
    obj.group.position.set(n.x || 0, n.y || 0, n.z || 0);
  }
  for (const edge of edges) {
    updateEdgePosition(edge.source, edge.target);
  }
}

function updateEdgePosition(s, t) {
  const key = `${s}-${t}`;
  const obj = edgeLines.get(key);
  if (!obj) return;
  const a = nodes.get(s), b = nodes.get(t);
  if (!a || !b) return;
  const pos = obj.geo.attributes.position;
  pos.setXYZ(0, a.x || 0, a.y || 0, a.z || 0);
  pos.setXYZ(1, b.x || 0, b.y || 0, b.z || 0);
  pos.needsUpdate = true;
}

export function updateAllEdgePositions() {
  for (const edge of edges) updateEdgePosition(edge.source, edge.target);
}

export function animate() {
  requestAnimationFrame(animate);
  if (simRunning) simulateForces();
  if (stars) stars.rotation.y += 0.0001;
  if (stars) stars.rotation.x += 0.00003;
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { scene } from './scene.js';
import {
  nodes, edges, nodeMeshes, edgeLines,
  nextId, incNextId, selectedId, setSelectedId, setNextId,
  highlightedId, setHighlightedId,
  setFocusMode, setFocusNeighborIds, setSearchQuery,
} from './state.js';

export const TYPE_COLORS = {
  root: '#38bdf8', idea: '#60a5fa', problem: '#ef4444',
  module: '#3b82f6', info: '#64748b', tech: '#8b5cf6', category: '#a78bfa',
};

export function getColor(id) {
  const n = nodes.get(id);
  return TYPE_COLORS[n?.type] || '#64748b';
}

const glowTexture = createGlowTexture();

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.6)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.3)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function createNodeObject(id) {
  const n = nodes.get(id);
  if (!n) return;

  const color = new THREE.Color(getColor(id));
  const isRoot = n.type === 'root';
  const radius = isRoot ? 1.2 : n.type === 'category' ? 0.7 : n.type === 'problem' ? 0.55 : 0.45;
  const group = new THREE.Group();

  // Sphere
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 24),
    new THREE.MeshPhysicalMaterial({
      color, emissive: color, emissiveIntensity: 0.3,
      metalness: 0.2, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3,
    })
  );
  group.add(mesh);

  // Invisible hitbox
  const hitMesh = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(radius * 2.5, 1.0), 8, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitMesh.userData.isHitbox = true;
  group.add(hitMesh);

  // Glow
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture, blending: THREE.AdditiveBlending,
    transparent: true, opacity: 0.4, color, depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(isRoot ? 5 : 3.5, isRoot ? 5 : 3.5, 1);
  group.add(glow);

  // Selection ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#60a5fa', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.3, radius * 1.5, 32), ringMat
  );
  ring.position.z = -0.01;
  group.add(ring);

  // Label
  const labelEl = document.createElement('div');
  labelEl.className = `label${isRoot ? ' root-label' : ''}${(!isRoot && n.type === 'info') ? ' small-label' : ''}`;
  labelEl.textContent = n.problemId ? `${n.problemId} - ${n.name}` : n.name;
  labelEl.style.color = color.getStyle();
  labelEl.style.cursor = 'pointer';
  const label = new CSS2DObject(labelEl);
  label.position.y = -radius * 1.8;
  group.add(label);

  group.position.set(n.x || 0, n.y || 0, n.z || 0);
  scene.add(group);

  const objData = { group, mesh, hitMesh, glow, label, ring, mat: mesh.material, glowMat, ringMat };
  nodeMeshes.set(id, objData);

  // Label click
  labelEl.addEventListener('click', (e) => {
    e.stopPropagation();
    selectNode(id);
  });
  labelEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, id);
  });

  return objData;
}

export function removeNodeObject(id) {
  const obj = nodeMeshes.get(id);
  if (!obj) return;
  scene.remove(obj.group);
  obj.mesh.geometry.dispose();
  obj.mat.dispose();
  obj.ring.geometry.dispose();
  obj.ringMat.dispose();
  obj.glowMat.dispose();
  nodeMeshes.delete(id);
}

export function updateNodeHighlight(id) {
  const obj = nodeMeshes.get(id);
  if (!obj) return;
  const isSelected = id === selectedId;
  obj.ringMat.opacity = isSelected ? 0.8 : 0;
  obj.mat.emissiveIntensity = isSelected ? 0.8 : id === highlightedId ? 0.6 : 0.3;
  obj.glowMat.opacity = isSelected ? 1 : id === highlightedId ? 0.9 : 0.4;
}

export function createEdgeObject(s, t) {
  const key = `${s}-${t}`;
  if (edgeLines.has(key)) return;
  const sNode = nodes.get(s), tNode = nodes.get(t);
  if (!sNode || !tNode) return;
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(sNode.x || 0, sNode.y || 0, sNode.z || 0),
    new THREE.Vector3(tNode.x || 0, tNode.y || 0, tNode.z || 0),
  ]);
  const mat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  edgeLines.set(key, { line, mat, geo });
}

export function removeEdgeObject(s, t) {
  const key = `${s}-${t}`;
  const obj = edgeLines.get(key);
  if (!obj) return;
  scene.remove(obj.line);
  obj.geo.dispose();
  obj.mat.dispose();
  edgeLines.delete(key);
}

export function syncEdges() {
  for (const [key, obj] of edgeLines) {
    const [s, t] = key.split('-').map(Number);
    if (!edges.some(e => e.source === s && e.target === t)) {
      scene.remove(obj.line); obj.geo.dispose(); obj.mat.dispose();
      edgeLines.delete(key);
    }
  }
  for (const edge of edges) {
    const key = `${edge.source}-${edge.target}`;
    if (!edgeLines.has(key)) createEdgeObject(edge.source, edge.target);
  }
}

export function addNode(name, type, description, impact, parentId, problemId, filterGroup) {
  const id = incNextId();
  const angle = Math.random() * Math.PI * 2;
  const angle2 = Math.random() * Math.PI * 2;
  const fg = filterGroup || type || 'idea';
  const n = {
    id, name, type: type || 'idea', filterGroup: fg,
    description: description || '', impact: impact || '',
    problemId: problemId || '',
    x: Math.cos(angle) * Math.sin(angle2) * (1 + Math.random() * 2),
    y: Math.sin(angle) * Math.sin(angle2) * (1 + Math.random() * 2),
    z: Math.cos(angle2) * (1 + Math.random() * 2),
    vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
  };
  if (parentId) {
    const parent = nodes.get(parentId);
    if (parent) {
      n.x = parent.x + (Math.random() - 0.5) * 3;
      n.y = parent.y + (Math.random() - 0.5) * 3;
      n.z = parent.z + (Math.random() - 0.5) * 3;
    }
  }
  nodes.set(id, n);
  createNodeObject(id);
  if (parentId) {
    edges.push({ source: parentId, target: id });
    createEdgeObject(parentId, id);
  }
  return id;
}

export function removeNode(id) {
  if (id == null) return;
  const toRemove = edges.filter(e => e.source === id || e.target === id);
  for (const e of toRemove) {
    removeEdgeObject(e.source, e.target);
    edges.splice(edges.indexOf(e), 1);
  }
  removeNodeObject(id);
  nodes.delete(id);
  if (selectedId === id) {
    setSelectedId(null);
    import('./ui.js').then(m => m.closePanel());
  }
}

export function updateNode(id, data) {
  const n = nodes.get(id);
  if (!n) return;
  Object.assign(n, data);
  const obj = nodeMeshes.get(id);
  if (!obj) return;
  const color = new THREE.Color(getColor(id));
  obj.mat.color.copy(color);
  obj.mat.emissive.copy(color);
  obj.glowMat.color.copy(color);
  obj.label.element.textContent = n.problemId ? `${n.problemId} - ${n.name}` : n.name;
  obj.label.element.style.color = color.getStyle();
  const isRoot = n.type === 'root';
  const radius = isRoot ? 1.2 : n.type === 'category' ? 0.7 : n.type === 'problem' ? 0.55 : 0.45;
  obj.mesh.geometry.dispose();
  obj.mesh.geometry = new THREE.SphereGeometry(radius, 24, 24);
  obj.ring.geometry.dispose();
  obj.ring.geometry = new THREE.RingGeometry(radius * 1.3, radius * 1.5, 32);
  obj.label.position.y = -radius * 1.8;
  obj.label.element.className = `label${isRoot ? ' root-label' : ''}${(!isRoot && n.type === 'info') ? ' small-label' : ''}`;
}

export function getNeighborIds(id) {
  const set = new Set([id]);
  for (const edge of edges) {
    if (edge.source === id) set.add(edge.target);
    if (edge.target === id) set.add(edge.source);
  }
  return set;
}

export function selectNode(id) {
  setSelectedId(id);
  import('./ui.js').then(m => m.openPanel(id));
}

// Imported lazily to avoid circular deps
let _showContextMenu;
export function showContextMenu(x, y, id) {
  if (!_showContextMenu) {
    import('./ui.js').then(m => { _showContextMenu = m.showContextMenu; _showContextMenu(x, y, id); });
  } else {
    _showContextMenu(x, y, id);
  }
}

export function clearGraph() {
  for (const [key, obj] of edgeLines) {
    scene.remove(obj.line); obj.geo.dispose(); obj.mat.dispose();
  }
  edgeLines.clear();
  for (const [id, obj] of nodeMeshes) {
    // Remove label DOM elements before removing group from scene,
    // otherwise CSS2DObject's 'removed' event doesn't fire on children
    obj.group.traverse(child => {
      if (child.element && child.element.parentNode) {
        child.element.parentNode.removeChild(child.element);
      }
    });
    scene.remove(obj.group);
    obj.mesh.geometry.dispose(); obj.mat.dispose();
    obj.ring.geometry.dispose(); obj.ringMat.dispose();
    obj.glowMat.dispose();
  }
  nodeMeshes.clear();
  nodes.clear();
  edges.splice(0, edges.length);
  setNextId(1);
  setSelectedId(null);
  setFocusMode(false);
  setFocusNeighborIds(new Set());
  setHighlightedId(null);
  setSearchQuery('');
  import('./ui.js').then(m => { m.closePanel(); m.updateUI(); });
}

export function restoreGraph(data) {
  if (!data) return;
  setNextId(data.nextId || 1);
  for (const n of (data.nodes || [])) {
    nodes.set(n.id, { ...n, vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0 });
    createNodeObject(n.id);
  }
  for (const e of (data.edges || [])) {
    edges.push({ source: e.source, target: e.target });
    createEdgeObject(e.source, e.target);
  }
}

export function serializeGraph() {
  const nodeArr = [];
  for (const n of nodes.values()) {
    nodeArr.push({
      id: n.id, name: n.name, type: n.type, filterGroup: n.filterGroup,
      description: n.description, impact: n.impact, problemId: n.problemId,
      x: n.x, y: n.y, z: n.z,
    });
  }
  const edgeArr = edges.map(e => ({ source: e.source, target: e.target }));
  return { nextId, nodes: nodeArr, edges: edgeArr };
}

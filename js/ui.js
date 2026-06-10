import * as THREE from 'three';
import {
  nodes, edges, nodeMeshes, edgeLines,
  selectedId, setSelectedId, setContextNodeId, contextNodeId,
  focusMode, setFocusMode,
  setHighlightedId, setSearchQuery, setSimRunning,
  activeFilters,
} from './state.js';
import {
  getColor, updateNodeHighlight, updateNode, removeNode, clearGraph,
  restoreGraph, serializeGraph, getNeighborIds, TYPE_COLORS, selectNode,
} from './graph.js';
import { applyFilters, applyFocus } from './filters.js';
import { camera, renderer } from './scene.js';
import { loadInitialData } from './data.js';
import { listMaps, loadMap, saveMap, createMap, deleteMap, renameMap, getCurrentMapId } from './storage.js';

let _saveTimer = null;
let _currentMapName = '';
function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    const id = getCurrentMapId();
    if (!id) return;
    const data = serializeGraph();
    saveMap(id, _currentMapName, data);
    showToast('💾 Salvo');
  }, 2000);
}

// ─── PANEL ────────────────────────────────────────────────────────────────

export function openPanel(id) {
  const n = nodes.get(id);
  if (!n) return;
  setSelectedId(id);
  applyFocus();
  document.getElementById('side-panel').classList.add('open');
  document.getElementById('panel-title').textContent = n.name;
  document.getElementById('panel-sub').textContent = `${n.type === 'problem' ? '🔴 Problema' : n.type} · ID: ${n.id}`;
  document.getElementById('panel-name').value = n.name;
  document.getElementById('panel-type').value = n.type;
  document.getElementById('panel-desc').value = n.description || '';

  const badge = document.getElementById('panel-id-badge');
  const causeGroup = document.getElementById('panel-cause-group');
  const impactGroup = document.getElementById('panel-impact-group');

  if (n.type === 'problem' && n.problemId) {
    badge.style.display = 'block';
    document.getElementById('panel-id-code').textContent = n.problemId;
    let sevColor = '#ef4444';
    const imp = n.impact || '';
    if (imp.includes('2,5') || imp.includes('20 ligações')) sevColor = '#eab308';
    if (imp.includes('Ruptura') || imp.includes('3-4 semanas') || imp.includes('Filiais') || imp.includes('Risco')) sevColor = '#f97316';
    document.getElementById('panel-id-code').style.cssText = `display:inline-block; background:${sevColor}22; color:${sevColor}; padding:2px 10px; border-radius:6px; font-size:12px; font-weight:700; letter-spacing:0.5px; border:1px solid ${sevColor}44;`;
    causeGroup.style.display = 'block';
    document.getElementById('panel-cause-display').textContent = n.description || 'Sem informação';
    impactGroup.style.display = 'block';
    document.getElementById('panel-impact-display').textContent = n.impact || 'Sem informação';
  } else {
    badge.style.display = 'none';
    causeGroup.style.display = 'none';
    impactGroup.style.display = 'none';
  }

  for (const [pid] of nodeMeshes) updateNodeHighlight(pid);
}

export function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  setSelectedId(null);
  applyFocus();
  for (const [id] of nodeMeshes) updateNodeHighlight(id);
}

export function showContextMenu(x, y, id) {
  setContextNodeId(id);
  const menu = document.getElementById('context-menu');
  menu.style.display = 'block';
  menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
  menu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
}

export function showToast(message) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

export function updateUI() {
  document.getElementById('node-count').textContent = `${nodes.size} nós`;
  document.getElementById('edge-count').textContent = `${edges.length} conexões`;
}

// ─── MANAGER ──────────────────────────────────────────────────────────────

export function showManager() {
  document.getElementById('manager-overlay').classList.remove('hidden');
  renderManagerList();
}

export function hideManager() {
  document.getElementById('manager-overlay').classList.add('hidden');
}

function renderManagerList() {
  const maps = listMaps();
  const list = document.getElementById('manager-list');
  const empty = document.getElementById('manager-empty');
  list.innerHTML = '';

  if (maps.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  for (const m of maps) {
    const item = document.createElement('div');
    item.className = 'manager-item';
    item.dataset.id = m.id;

    const ago = timeAgo(m.updatedAt);
    item.innerHTML = `
      <div class="mi-icon">${m.nodeCount > 0 ? '🌐' : '📄'}</div>
      <div class="mi-info">
        <div class="mi-name">${escHtml(m.name)}</div>
        <div class="mi-meta">${m.nodeCount} nós · ${ago}</div>
      </div>
      <div class="mi-actions">
        <button class="mi-rename" title="Renomear">✏️</button>
        <button class="mi-del" title="Excluir">🗑️</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.mi-actions')) return;
      openMap(m.id);
    });

    item.querySelector('.mi-rename').addEventListener('click', (e) => {
      e.stopPropagation();
      startRename(item, m.id, m.name);
    });

    item.querySelector('.mi-del').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Excluir "${m.name}"? Esta ação não pode ser desfeita.`)) {
        deleteMap(m.id);
        renderManagerList();
        showToast(`"${m.name}" excluído`);
      }
    });

    list.appendChild(item);
  }
}

function startRename(item, id, currentName) {
  item.classList.add('renaming');
  const input = document.createElement('input');
  input.className = 'mi-rename-input';
  input.type = 'text';
  input.value = currentName;
  input.style.display = 'block';
  item.querySelector('.mi-info').appendChild(input);
  input.focus();
  input.select();

  const finish = (save) => {
    if (save && input.value.trim()) {
      renameMap(id, input.value.trim());
      showManager();
    }
    item.classList.remove('renaming');
    input.remove();
  };

  input.addEventListener('blur', () => finish(false));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function openMap(id) {
  const mapData = loadMap(id);
  if (!mapData) { showToast('⚠️ Mapa não encontrado'); return; }
  closePanel();
  clearGraph();
  restoreGraph(mapData.data);
  applyFilters();
  updateUI();
  _currentMapName = mapData.name;
  document.getElementById('map-name-badge').textContent = mapData.name;
  hideManager();
  showToast(`📂 ${mapData.name} carregado`);
}

// ─── EVENT BINDING ────────────────────────────────────────────────────────

function trickleSave() {
  scheduleSave();
}

export function bindEvents() {
  // Manager buttons
  document.getElementById('btn-manager').addEventListener('click', showManager);

  document.getElementById('manager-new').addEventListener('click', () => {
    const entry = createMap('Novo Mapa');
    _currentMapName = entry.name;
    closePanel();
    clearGraph();
    applyFilters();
    updateUI();
    document.getElementById('map-name-badge').textContent = entry.name;
    hideManager();
    showToast(`📄 "${entry.name}" criado`);
    // Open modal for first idea
    setTimeout(() => document.getElementById('btn-new-root').click(), 300);
  });

  document.getElementById('manager-example').addEventListener('click', () => {
    const entry = createMap('Construfácil - Exemplo');
    _currentMapName = entry.name;
    closePanel();
    clearGraph();
    loadInitialData();
    document.getElementById('map-name-badge').textContent = entry.name;
    saveMap(entry.id, entry.name, serializeGraph());
    applyFilters();
    updateUI();
    hideManager();
    showToast('📦 Exemplo Construfácil carregado!');
  });

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    setSearchQuery(e.target.value.toLowerCase().trim());
    setHighlightedId(null);
    applyFilters();
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (activeFilters.has(filter)) { activeFilters.delete(filter); btn.classList.remove('active'); }
      else { activeFilters.add(filter); btn.classList.add('active'); }
      applyFilters();
    });
  });

  // New root idea
  document.getElementById('btn-new-root').addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Nova Ideia';
    document.getElementById('modal-sub').textContent = 'Adicione um nó raiz ao grafo de pensamentos';
    document.getElementById('modal-name').value = '';
    document.getElementById('modal-type').value = 'idea';
    document.getElementById('modal-desc').value = '';
    document.getElementById('modal-parent').value = '';
    document.getElementById('modal-parent-field').style.display = 'block';
    document.getElementById('modal-overlay').classList.add('open');
    setTimeout(() => document.getElementById('modal-name').focus(), 100);
    window._modalParent = null;
  });

  // Layout
  document.getElementById('btn-layout').addEventListener('click', () => {
    for (const n of nodes.values()) {
      n.vx = (Math.random() - 0.5) * 0.5;
      n.vy = (Math.random() - 0.5) * 0.5;
      n.vz = (Math.random() - 0.5) * 0.5;
    }
    setSimRunning(true);
    showToast('Reorganizando grafo...');
  });

  // Focus toggle
  document.getElementById('btn-focus').addEventListener('click', () => {
    setFocusMode(!focusMode);
    document.getElementById('btn-focus').classList.toggle('active');
    document.getElementById('btn-focus').textContent = focusMode ? '🎯 Foco ON' : '🎯 Foco';
    applyFocus();
    showToast(focusMode ? 'Modo foco: clique num nó para isolar conexões' : 'Modo foco desligado');
  });

  // Context menu actions
  document.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      const id = contextNodeId;
      document.getElementById('context-menu').style.display = 'none';
      const n = nodes.get(id);
      if (!n) return;

      if (action === 'add-child') {
        document.getElementById('modal-title').textContent = `Filho de "${n.name}"`;
        document.getElementById('modal-sub').textContent = 'Adicione uma ideia conectada a este nó';
        document.getElementById('modal-name').value = '';
        document.getElementById('modal-type').value = 'idea';
        document.getElementById('modal-desc').value = '';
        document.getElementById('modal-parent').value = id;
        document.getElementById('modal-parent-field').style.display = 'none';
        document.getElementById('modal-overlay').classList.add('open');
        setTimeout(() => document.getElementById('modal-name').focus(), 100);
        window._modalParent = id;
      } else if (action === 'add-sibling') {
        let parentId = null;
        for (const edge of edges) { if (edge.target === id) { parentId = edge.source; break; } }
        const parent = parentId ? nodes.get(parentId) : null;
        document.getElementById('modal-title').textContent = parent ? `Irmão de "${n.name}"` : 'Nova Ideia';
        document.getElementById('modal-sub').textContent = parent ? `Conectado a "${parent.name}"` : 'Nó raiz';
        document.getElementById('modal-name').value = '';
        document.getElementById('modal-type').value = 'idea';
        document.getElementById('modal-desc').value = '';
        document.getElementById('modal-parent').value = parentId || '';
        document.getElementById('modal-parent-field').style.display = 'none';
        document.getElementById('modal-overlay').classList.add('open');
        setTimeout(() => document.getElementById('modal-name').focus(), 100);
        window._modalParent = parentId;
      } else if (action === 'focus') {
        const target = new THREE.Vector3(n.x || 0, n.y || 0, n.z || 0);
        import('./scene.js').then(m => { m.controls.target.copy(target); });
        showToast(`Focado em: ${n.name}`);
      } else if (action === 'delete') {
        if (confirm(`Excluir "${n.name}"? Isso vai remover também as conexões.`)) {
          removeNode(id);
          showToast(`"${n.name}" removido`);
          updateUI();
          applyFilters();
          trickleSave();
        }
      }
    });
  });

  // Canvas right-click
  const rCanvas = renderer.domElement;
  rCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = rCanvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const hits = [];
      for (const [id, obj] of nodeMeshes) {
        if (obj.group.visible) {
          hits.push({ mesh: obj.mesh, id }, { mesh: obj.hitMesh, id });
        }
      }
      const intersects = raycaster.intersectObjects(hits.map(h => h.mesh));
      if (intersects.length > 0) {
        const hitId = hits.find(h => h.mesh === intersects[0].object)?.id;
        if (hitId !== undefined) { showContextMenu(e.clientX, e.clientY, hitId); return; }
      }
      document.getElementById('context-menu').style.display = 'none';
    });

    // Canvas left-click
    rCanvas.addEventListener('click', (e) => {
      if (e.button !== 0) return;
      if (document.getElementById('context-menu').style.display === 'block') return;
      const rect = rCanvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const hits = [];
      for (const [id, obj] of nodeMeshes) {
        if (obj.group.visible) {
          hits.push({ mesh: obj.mesh, id }, { mesh: obj.hitMesh, id });
        }
      }
      const intersects = raycaster.intersectObjects(hits.map(h => h.mesh));
      if (intersects.length > 0) {
        const hitId = hits.find(h => h.mesh === intersects[0].object)?.id;
        if (hitId !== undefined) { selectNode(hitId); return; }
      }
      closePanel();
    });

  // Close context menu on any click
  document.addEventListener('click', () => { document.getElementById('context-menu').style.display = 'none'; });

  // Modal
  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('open');
  });
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('modal-overlay').classList.remove('open');
  });
  document.getElementById('modal-confirm').addEventListener('click', async () => {
    const name = document.getElementById('modal-name').value.trim();
    if (!name) { showToast('O nome é obrigatório'); return; }
    const type = document.getElementById('modal-type').value;
    const desc = document.getElementById('modal-desc').value.trim();
    const parentId = window._modalParent || null;
    const fg = type;
    const mod = await import('./graph.js');
    const id = mod.addNode(name, type, desc, '', parentId, '', fg);
    document.getElementById('modal-overlay').classList.remove('open');
    showToast(`"${name}" adicionado!`);
    selectNode(id);
    updateUI();
    applyFilters();
    trickleSave();
  });
  window._modalParent = null;

  // Panel save
  document.getElementById('panel-save').addEventListener('click', () => {
    if (selectedId === null) return;
    const name = document.getElementById('panel-name').value.trim();
    if (!name) { showToast('Nome não pode ficar vazio'); return; }
    const newType = document.getElementById('panel-type').value;
    updateNode(selectedId, {
      name, type: newType, filterGroup: newType,
      description: document.getElementById('panel-desc').value.trim(),
      impact: document.getElementById('panel-impact-display')?.textContent || '',
    });
    document.getElementById('panel-title').textContent = name;
    document.getElementById('panel-sub').textContent = `${newType} · ID: ${selectedId}`;
    showToast('Salvo!');
    trickleSave();
  });

  // Panel add child
  document.getElementById('panel-add-child').addEventListener('click', () => {
    if (selectedId === null) return;
    const n = nodes.get(selectedId);
    if (!n) return;
    document.getElementById('modal-title').textContent = `Filho de "${n.name}"`;
    document.getElementById('modal-sub').textContent = 'Adicione uma ideia conectada a este nó';
    document.getElementById('modal-name').value = '';
    document.getElementById('modal-type').value = 'idea';
    document.getElementById('modal-desc').value = '';
    document.getElementById('modal-parent').value = selectedId;
    document.getElementById('modal-parent-field').style.display = 'none';
    document.getElementById('modal-overlay').classList.add('open');
    setTimeout(() => document.getElementById('modal-name').focus(), 100);
    window._modalParent = selectedId;
  });

  // Panel delete
  document.getElementById('panel-delete').addEventListener('click', () => {
    if (selectedId === null) return;
    const n = nodes.get(selectedId);
    if (n && confirm(`Excluir "${n.name}" e suas conexões?`)) {
      const name = n.name;
      removeNode(selectedId);
      showToast(`"${name}" removido`);
      updateUI();
      applyFilters();
      trickleSave();
    }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePanel();
      document.getElementById('modal-overlay').classList.remove('open');
      document.getElementById('context-menu').style.display = 'none';
    }
    if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,select')) {
      document.getElementById('btn-new-root').click();
    }
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,select')) {
      document.getElementById('btn-layout').click();
    }
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,select')) {
      document.getElementById('btn-focus').click();
    }
    if (e.key === 'Delete' && selectedId !== null && !e.target.closest('input,textarea,select')) {
      document.getElementById('panel-delete').click();
    }
  });
}

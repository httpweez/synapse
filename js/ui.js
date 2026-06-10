import * as THREE from 'three';
import {
  nodes, edges, nodeMeshes, edgeLines,
  selectedId, setSelectedId, setContextNodeId, contextNodeId,
  focusMode, setFocusMode,
  setHighlightedId, setSearchQuery, setSimRunning,
  activeFilters,
} from './state.js';
import {
  getColor, updateNodeHighlight, updateNode, removeNode,
  getNeighborIds, TYPE_COLORS, selectNode,
} from './graph.js';
import { applyFilters, applyFocus } from './filters.js';
import { camera, renderer } from './scene.js';


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

// ─── EVENT BINDING ────────────────────────────────────────────────────────

export function bindEvents() {
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
        // Find controls via the scene's orbit controls
        import('./scene.js').then(m => { m.controls.target.copy(target); });
        showToast(`Focado em: ${n.name}`);
      } else if (action === 'delete') {
        if (confirm(`Excluir "${n.name}"? Isso vai remover também as conexões.`)) {
          removeNode(id);
          showToast(`"${n.name}" removido`);
          updateUI();
          applyFilters();
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
  document.getElementById('modal-confirm').addEventListener('click', () => {
    const name = document.getElementById('modal-name').value.trim();
    if (!name) { showToast('O nome é obrigatório'); return; }
    const type = document.getElementById('modal-type').value;
    const desc = document.getElementById('modal-desc').value.trim();
    const parentId = window._modalParent || null;
    const fg = type;
    const { addNode } = await import('./graph.js');
    const id = addNode(name, type, desc, '', parentId, '', fg);
    document.getElementById('modal-overlay').classList.remove('open');
    showToast(`"${name}" adicionado!`);
    selectNode(id);
    updateUI();
    applyFilters();
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

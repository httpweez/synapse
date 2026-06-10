import * as THREE from 'three';
import {
  nodes, edges, nodeMeshes, edgeLines,
  selectedId, activeFilters, searchQuery, highlightedId, setHighlightedId,
  focusMode, focusNeighborIds, setFocusNeighborIds,
} from './state.js';
import { updateNodeHighlight, getNeighborIds } from './graph.js';

export function applyFilters() {
  for (const [id, obj] of nodeMeshes) {
    const n = nodes.get(id);
    if (!n) continue;
    if (n.type === 'root') { obj.group.visible = true; continue; }
    const matchesFilter = activeFilters.has(n.filterGroup);
    const matchesSearch = !searchQuery || n.name.toLowerCase().includes(searchQuery);
    obj.group.visible = matchesFilter && matchesSearch;
    if (matchesFilter && matchesSearch && searchQuery && n.type !== 'root') {
      setHighlightedId(id);
    }
  }

  for (const [key, obj] of edgeLines) {
    const [s, t] = key.split('-').map(Number);
    const sN = nodeMeshes.get(s), tN = nodeMeshes.get(t);
    obj.line.visible = sN?.group.visible && tN?.group.visible;
  }

  applyFocus();

  for (const [id] of nodeMeshes) updateNodeHighlight(id);
}

export function applyFocus() {
  if (!focusMode || selectedId === null) {
    for (const [id, obj] of nodeMeshes) {
      if (!obj.group.visible) continue;
      obj.mat.opacity = 1; obj.mat.transparent = false;
      obj.glowMat.opacity = 0.4;
      obj.label.element.style.opacity = '1';
    }
    for (const [key, obj] of edgeLines) {
      if (!obj.line.visible) continue;
      obj.mat.opacity = 0.4;
      obj.mat.color.setHex(0x334155);
    }
    return;
  }

  const ns = getNeighborIds(selectedId);
  setFocusNeighborIds(ns);

  for (const [id, obj] of nodeMeshes) {
    const n = nodes.get(id);
    if (!n || !obj.group.visible) continue;
    if (n.type === 'root') continue;
    obj.mat.transparent = true;
    if (id === selectedId) {
      obj.mat.opacity = 1; obj.glowMat.opacity = 1; obj.label.element.style.opacity = '1';
    } else if (ns.has(id)) {
      obj.mat.opacity = 1; obj.glowMat.opacity = 0.7; obj.label.element.style.opacity = '1';
    } else {
      obj.mat.opacity = 0.12; obj.glowMat.opacity = 0.05; obj.label.element.style.opacity = '0.2';
    }
  }

  for (const [key, obj] of edgeLines) {
    if (!obj.line.visible) continue;
    const [s, t] = key.split('-').map(Number);
    const sIn = ns.has(s), tIn = ns.has(t);
    const isSelectedEdge = s === selectedId || t === selectedId;
    if (sIn && tIn) {
      obj.mat.opacity = isSelectedEdge ? 0.9 : 0.3;
      obj.mat.color.setHex(isSelectedEdge ? 0x60a5fa : 0x334155);
    } else {
      obj.mat.opacity = 0.04;
    }
  }
}

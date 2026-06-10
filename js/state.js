// ─── GLOBAL STATE ────────────────────────────────────────────────────────
export const nodes = new Map();
export const edges = [];
export const nodeMeshes = new Map();
export const edgeLines = new Map();
export let nextId = 1;

export let selectedId = null;
export let contextNodeId = null;
export let simRunning = true;
export let focusMode = false;
export let focusNeighborIds = new Set();
export let highlightedId = null;
export let searchQuery = '';

export const activeFilters = new Set([
  'problem-critical', 'problem-severe', 'problem-moderate',
  'module', 'tech', 'info', 'category', 'idea',
]);

export function setSelectedId(v) { selectedId = v; }
export function setContextNodeId(v) { contextNodeId = v; }
export function setSimRunning(v) { simRunning = v; }
export function setFocusMode(v) { focusMode = v; }
export function setFocusNeighborIds(v) { focusNeighborIds = v; }
export function setHighlightedId(v) { highlightedId = v; }
export function setSearchQuery(v) { searchQuery = v; }
export function setNextId(v) { nextId = v; }
export function incNextId() { return nextId++; }

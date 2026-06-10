const STORAGE_KEY = 'synapse_maps';
let _currentMapId = null;

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveAll(maps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
}

export function listMaps() {
  return getAll().map(m => ({
    id: m.id, name: m.name, description: m.description,
    createdAt: m.createdAt, updatedAt: m.updatedAt,
    nodeCount: m.data ? m.data.nodes.length : 0,
  }));
}

export function loadMap(id) {
  const maps = getAll();
  return maps.find(m => m.id === id) || null;
}

export function saveMap(id, name, data) {
  const maps = getAll();
  const idx = maps.findIndex(m => m.id === id);
  const entry = {
    id, name: name || 'Sem nome',
    description: '',
    createdAt: idx !== -1 ? maps[idx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data,
  };
  if (idx !== -1) maps[idx] = entry;
  else maps.push(entry);
  saveAll(maps);
  _currentMapId = id;
  return entry;
}

export function deleteMap(id) {
  let maps = getAll();
  maps = maps.filter(m => m.id !== id);
  saveAll(maps);
  if (_currentMapId === id) _currentMapId = null;
}

export function createMap(name) {
  const id = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const entry = {
    id, name: name || 'Novo Mapa',
    description: '', createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: { nextId: 1, nodes: [], edges: [] },
  };
  const maps = getAll();
  maps.push(entry);
  saveAll(maps);
  _currentMapId = id;
  return entry;
}

export function getCurrentMapId() { return _currentMapId; }

export function renameMap(id, newName) {
  const maps = getAll();
  const m = maps.find(x => x.id === id);
  if (m) { m.name = newName; m.updatedAt = new Date().toISOString(); saveAll(maps); }
}

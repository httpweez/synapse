import { initialize, animate } from './scene.js';
import { bindEvents, updateUI, showManager } from './ui.js';
import { applyFilters } from './filters.js';
import { listMaps } from './storage.js';

// ─── INIT ────────────────────────────────────────────────────────────────
initialize();
bindEvents();
updateUI();
applyFilters();
animate();

// Show manager on startup
showManager();

console.log('✨ Thoughts 3D — Mapa Mental Interativo');
console.log('📂 Gerenciador de mapas mentais');
console.log('🖱️  Clique = selecionar · Direito = menu · Scroll = zoom');
console.log('⌨️  N = nova ideia · R = reorganizar · F = modo foco · Del = excluir');

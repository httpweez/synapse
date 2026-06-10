import { initialize, animate } from './scene.js';
import { loadInitialData } from './data.js';
import { bindEvents, updateUI } from './ui.js';
import { applyFilters } from './filters.js';
import { nodes, edges } from './state.js';

// ─── INIT ────────────────────────────────────────────────────────────────
initialize();
loadInitialData();
bindEvents();
updateUI();
applyFilters();
animate();
console.log('✨ Thoughts 3D — Mapa Mental Interativo');
console.log(`📊 ${nodes.size} nós, ${edges.length} conexões carregados`);
console.log('🖱️  Clique = selecionar · Direito = menu · Scroll = zoom');
console.log('⌨️  N = nova ideia · R = reorganizar · F = modo foco · Del = excluir');

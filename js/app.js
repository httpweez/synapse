import { initialize, animate } from './scene.js';
import { loadInitialData } from './data.js';
import { bindEvents, updateUI, setSceneModule, setGraphModule } from './ui.js';
import { applyFilters } from './filters.js';
import * as sceneModule from './scene.js';
import * as graphModule from './graph.js';

// Resolve circular deps
setSceneModule(sceneModule);
setGraphModule(graphModule);

// ─── INIT ────────────────────────────────────────────────────────────────
initialize();
loadInitialData();
bindEvents();
updateUI();
applyFilters();
animate();

console.log('✨ Thoughts 3D — Mapa Mental Interativo');
console.log(`📊 ${graphModule.nodes.size} nós, ${graphModule.edges.length} conexões carregados`);
console.log('🖱️  Clique = selecionar · Direito = menu · Scroll = zoom');
console.log('⌨️  N = nova ideia · R = reorganizar · F = modo foco · Del = excluir');

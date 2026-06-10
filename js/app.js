import { initialize, animate } from './scene.js';
import { loadInitialData } from './data.js';
import { bindEvents, updateUI, showToast, showWelcome } from './ui.js';
import { applyFilters } from './filters.js';
import { nodes, edges } from './state.js';

// ─── INIT ────────────────────────────────────────────────────────────────
initialize();
bindEvents();
updateUI();
applyFilters();
animate();
showWelcome();

// Expõe loadInitialData globalmente pro botão de exemplo
window.loadExampleData = () => {
  if (nodes.size > 0) { showToast('⚠️ Já existem dados no mapa'); return; }
  loadInitialData();
  applyFilters();
  updateUI();
  showToast('📦 Projeto exemplo Construfácil carregado!');
};
console.log('✨ Thoughts 3D — Mapa Mental Interativo');
console.log('🖱️  Clique = selecionar · Direito = menu · Scroll = zoom');
console.log('⌨️  N = nova ideia · R = reorganizar · F = modo foco · Del = excluir');

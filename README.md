<div align="center">

<br/>

# 🧠 Synapse

**Mapa mental 3D — para quem pensa em grafos, não em listas.**

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Three.js](https://img.shields.io/badge/Three.js-r158-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Dependências](https://img.shields.io/badge/deps-zero-4ade80?style=flat-square)](#)
[![Offline-first](https://img.shields.io/badge/offline--first-✓-60a5fa?style=flat-square)](#)
[![Licença](https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square)](LICENSE)

[**Demo ao vivo →**](https://httpweez.github.io/synapse/) · [Reportar bug](https://github.com/httpweez/synapse/issues) · [Sugerir feature](https://github.com/httpweez/synapse/issues)

<br/>

![Synapse Screenshot](https://raw.githubusercontent.com/httpweez/synapse/main/screenshot.png)

> *Mapa de diagnóstico de uma empresa fictícia — 42 nós, 60 conexões.*

</div>

---

## 📌 Índice

- [O que é](#-o-que-é)
- [Diferenciais](#-diferenciais)
- [Features em detalhe](#-features-em-detalhe)
- [Tipos de nó](#-tipos-de-nó)
- [Atalhos de teclado](#-atalhos-de-teclado)
- [Arquitetura do projeto](#-arquitetura-do-projeto)
- [Stack técnica](#-stack-técnica)
- [Rodando localmente](#-rodando-localmente)
- [Estrutura de dados](#-estrutura-de-dados)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🧠 O que é

Synapse é um **segundo cérebro visual** que roda inteiramente no navegador. Você abre uma página e tem uma tela infinita no espaço 3D para conectar qualquer coisa: ideias de produto, diagnósticos de sistema, arquitetura de software, fluxos de problema, mapeamento de processos, organização de estudos — o que vier à cabeça.

**Sem conta. Sem cloud. Sem assinatura. Sem build. Zero dependências.** Os dados ficam no seu browser, offline.

> **Por que não o Obsidian?** Obsidian é ótimo para texto. Synapse é para quando você precisa *ver as relações* — um grafo 3D orbital onde você pode girar, dar zoom e filtrar por tipo em tempo real.

---

## ✨ Diferenciais

| ⚡ | Synapse | Outras ferramentas |
|---|---|---|
| **Build step** | Zero. Clone e sirva. | npm install, webpack, bundlers |
| **Dependências** | 1 (Three.js, embutido) | Dezenas a centenas |
| **Internet** | 100% offline-first | Requer conexão frequente |
| **Conta/cadastro** | Não | Quase sempre |
| **Preço** | Gratuito, MIT | Freemium ou subscription |
| **Persistência** | localStorage (seu controle) | Cloud proprietária |
| **Espaço de trabalho** | 3D orbital | 2D plano |
| **Performance** | nativa (WebGL + CSS2D) | Electron pesado |

---

## 🚀 Features em detalhe

### 🌐 Grafo 3D interativo

- **Órbita livre** — arraste para girar a cena, scroll para zoom. Câmera com damping suave e limites de distância (5–120 unidades).
- **Nós esféricos** com material físico (`MeshPhysicalMaterial`) — metalicidade 0.2, rugosidade 0.3, clearcoat 0.4. Brilho emissivo com intensidade variável.
- **Glow dinâmico** — sprite com gradiente radial e blending aditivo em volta de cada nó.
- **Anel de seleção** — `RingGeometry` que fade in/out ao selecionar.
- **Labels HTML** sobrepostas ao 3D via `CSS2DRenderer` — cores tipográficas por tipo, sombra e backdrop-filter para legibilidade.
- **Arestas** como linhas 3D com opacidade 0.4 e cor `#334155`.
- **Campo de estrelas** — 3000 partículas distribuídas esfericamente, rotação sutil, criando profundidade e atmosfera.

### 🔄 Layout físico (force-directed)

- **Repulsão coulombiana** entre todos os nós (força 80, distância mínima 0.01).
- **Atração de mola** nas arestas (constante 0.008, comprimento de repouso 4 unidades).
- **Gravidade central** (0.003) mantendo o grafo centralizado.
- **Amortecimento** de velocidade (0.92/frame) com velocidade máxima 3 e mínima 0.001.
- Botão **"Reorganizar"** (`R`) — aplica perturbacão aleatória em todos os nós e reativa a simulação.

### 📂 Gerenciador de mapas

- Criação, carregamento, exclusão e renomeação **inline** de mapas.
- **Auto-save** com debounce de 2 segundos após qualquer mutação.
- Mapa de exemplo embutido ("Construfácil") — 42 nós, 60 conexões, carregável com um clique.
- Reset total via URL `?reset`.

### 🎨 Sistema de tipos e filtros

**8 tipos de nó + 3 níveis de severidade:**

- **Filtros ao vivo** — toggle por tipo na barra inferior, com feedback visual imediato.
- **Busca textual** — filtra nós pelo nome em tempo real, com highlight automático.
- **Modo Foco** (`F`) — isola o nó selecionado e suas conexões diretas, escurecendo o resto (opacidade 0.12).

### 🖱️ Interação completa

- **Clique esquerdo** — seleciona nó via raycaster, abre painel lateral com edição.
- **Clique direito** — menu de contexto posicionado no cursor: adicionar filho, irmão, focar câmera, excluir.
- **Painel lateral** deslizante — edita nome, tipo e descrição sem sair da cena. Para problemas: exibe badge de severidade, causa raiz e impacto estimado.
- **Modal "Nova Ideia"** — cria nós com nome, tipo, descrição e vínculo opcional a um nó pai.
- **Reorganizar** — redistribui todos os nós com um clique.

### ⌨️ Atalhos de teclado

| Tecla | Ação |
|---|---|
| `N` | Nova ideia (abre modal) |
| `R` | Reorganizar grafo |
| `F` | Alternar modo foco |
| `Delete` | Excluir nó selecionado |
| `Escape` | Fechar painel / modal / menu |

### 💾 Persistência inteligente

- Dados salvos automaticamente em `localStorage` com debounce de 2s.
- Timer de auto-save é pausado antes de operações no gerenciador para evitar sobrescrita com dados obsoletos.
- Múltiplos mapas isolados — cada um com seu próprio conjunto de nós, arestas e metadados.

### 🔧 Engenharia

- **Zero build step** — ES Modules nativos via `<script type="importmap">`. Sem Webpack, Vite, Rollup ou npm.
- **Zero dependências runtime** além do Three.js (r158), bundlado localmente em `lib/three/`.
- **Offline-first** — tudo no `localStorage`, funciona sem internet.
- **Importação dinâmica** para evitar dependências circulares entre módulos (`graph.js` ↔ `ui.js`).
- **Limpeza rigorosa de DOM** — label elements removidos manualmente ao limpar o grafo para evitar vazamento de nós CSS2D.
- **Fallback `file://`** — detecta protocolo local e exibe instruções de uso com servidor HTTP.

---

## 🎯 Tipos de nó

| Tipo | Cor | Tamanho | Uso sugerido |
|---|---|---|---|
| **Raiz** | `#38bdf8` | 1.2 | Nó central do mapa |
| **Ideia** | `#60a5fa` | 0.45 | Conceitos, hipóteses, features |
| **Problema crítico** | `#ef4444` | 0.55 | Bloqueadores, bugs em produção |
| **Problema grave** | `#eab308` | 0.55 | Issues de alta prioridade |
| **Problema moderado** | `#f97316` | 0.55 | Dívida técnica, melhorias |
| **Módulo** | `#3b82f6` | 0.45 | Componentes, serviços, domínios |
| **Tech / Stack** | `#8b5cf6` | 0.45 | Tecnologias, dependências |
| **Categoria** | `#a78bfa` | 0.70 | Agrupadores, épicos, áreas |
| **Info** | `#64748b` | 0.45 | Contexto, métricas, anotações |

---

## ⌨️ Atalhos de teclado

| Entrada | Ação |
|---|---|
| `N` | Nova ideia (abre modal) |
| `R` | Reorganizar grafo |
| `F` | Alternar modo foco |
| `Delete` | Excluir nó selecionado |
| `Escape` | Fechar painel / modal / menu |
| Scroll | Zoom in / out |
| Arrastar | Orbitar câmera |
| Clique esquerdo | Selecionar nó |
| Clique direito | Menu de contexto |

---

## 🏗️ Arquitetura do projeto

```
synapse/
├── index.html              # Entry point — toda a UI em HTML semântico
├── css/
│   └── style.css           # Tema escuro, layout responsivo, animações
├── js/
│   ├── app.js              # Entry point — inicializa cena, eventos, animação
│   ├── scene.js            # Three.js — cena, câmera, renderizadores, iluminação, estrelas, física
│   ├── graph.js            # Grafo — CRUD de nós/arestas, objetos 3D, serialização
│   ├── state.js            # Estado global — Maps, sets, variáveis reativas
│   ├── ui.js               # Controller — painéis, modais, menus, eventos DOM
│   ├── storage.js          # Persistência — localStorage, CRUD de mapas
│   ├── data.js             # Dataset de exemplo — Construfácil (42 nós)
│   └── filters.js          # Filtragem — visibilidade por tipo, busca, modo foco
├── lib/
│   └── three/              # Three.js r158 (vendored)
│       ├── three.module.js
│       ├── controls/OrbitControls.js
│       └── renderers/CSS2DRenderer.js
└── README.md
```

### Fluxo de inicialização

```
app.js
  ├── scene.initialize()        → Three.js scene, camera, renderers, lights, stars
  ├── ui.bindEvents()           → DOM & canvas event listeners
  ├── ui.updateUI()             → contadores (0 nós, 0 conexões)
  ├── filters.applyFilters()    → visibilidade inicial
  ├── scene.animate()           → loop: física → orbit controls → WebGL → CSS2D
  └── ui.showManager()          → overlay do gerenciador de mapas
```

### Pipeline de renderização

```
requestAnimationFrame(animate)
  ├── simulateForces()
  │     ├── reset forces
  │     ├── repulsão coulombiana
  │     ├── atração de mola
  │     ├── gravidade central
  │     ├── aplicar velocidade + amortecimento
  │     └── atualizar posições 3D
  ├── rotacionar estrelas (y += 0.0001)
  ├── controls.update()
  ├── renderer.render(scene, camera)       ← WebGL
  └── labelRenderer.render(scene, camera)  ← CSS2D (labels HTML)
```

---

## 🛠 Stack técnica

| Camada | Tecnologia |
|---|---|
| **Linguagem** | JavaScript ES2022 (ES Modules) |
| **Renderização 3D** | Three.js r158 (WebGL) |
| **Labels HTML** | CSS2DRenderer (Three.js addon) |
| **Controles de câmera** | OrbitControls (Three.js addon) |
| **Persistência** | localStorage (navegador) |
| **Servidor local** | `python3 -m http.server` ou `npx serve` |
| **Dependências runtime** | **1** (Three.js) |
| **Build tools** | **zero** |

---

## ▶️ Rodando localmente

Synapse usa ES Modules — precisa de um servidor HTTP (não abre como `file://`).

**Opção 1 — Python** (já vem instalado)
```bash
git clone https://github.com/httpweez/synapse
cd synapse
python3 -m http.server 8080
```
Abra [http://localhost:8080](http://localhost:8080).

**Opção 2 — Node.js**
```bash
npx serve .
```

**Opção 3 — GitHub Pages**

Ative em `Settings → Pages → Branch: main / root`:
```
https://httpweez.github.io/synapse/
```

---

## 💿 Estrutura de dados

Cada mapa é armazenado em `localStorage` sob a chave `synapse_maps`:

```json
{
  "id": "m_1718000000000_abc1",
  "name": "Meu Mapa",
  "description": "",
  "createdAt": "2026-06-10T12:00:00.000Z",
  "updatedAt": "2026-06-10T12:30:00.000Z",
  "data": {
    "nextId": 10,
    "nodes": [
      {
        "id": 1,
        "name": "Ideia central",
        "type": "root",
        "filterGroup": "root",
        "description": "Descrição do nó",
        "impact": "Impacto estimado",
        "problemId": "",
        "x": 0.5, "y": -0.3, "z": 0.1
      }
    ],
    "edges": [
      { "source": 1, "target": 2 }
    ]
  }
}
```

> **Não serializado:** velocidades, forças, objetos Three.js, estado de seleção/foco/busca — tudo recalculado ao carregar.

---

## 🗺️ Roadmap

- [ ] **Export / import** de mapas em JSON
- [ ] **Colaboração via URL** compartilhável (sem servidor)
- [ ] **Temas de cor** customizáveis
- [ ] **Busca por conteúdo** da descrição
- [ ] **Animações de transição** entre layouts
- [ ] **Modo apresentação** — navega pelos nós como slides
- [ ] **Undo / redo**
- [ ] **Múltiplas seleções** e operações em lote

---

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças grandes, abra uma issue primeiro.

```bash
git clone https://github.com/httpweez/synapse
cd synapse
python3 -m http.server 8080
# edite, salve, recarregue — sem build
```

O projeto é intencionalmente simples: sem bundlers, sem config, sem `node_modules`. A barreira de entrada é mínima.

---

## 📄 Licença

[MIT](LICENSE) © [httpweez](https://github.com/httpweez)

---

<div align="center">
<br/>
<sub>
🧠 Synapse — Feito com Three.js e JavaScript puro.<br/>
Roda no seu browser. Fica no seu browser. Zero dependências. Livre como em liberdade.
</sub>
<br/>
<br/>
</div>

# Thoughts 3D

Interactive 3D mind mapping application built with Three.js. Create, connect, and explore ideas in a 3D force-directed graph.

## Features

- **3D Force-Directed Graph** — nodes repel, edges attract, creating organic layouts
- **Filters** — toggle visibility by type (problems, modules, tech, info, etc.)
- **Focus Mode** — isolate a node and its direct connections
- **Node CRUD** — add child/sibling nodes, edit, delete
- **Search** — highlight nodes by name
- **Detailed Panel** — click any node to view/edit its data
- **Context Menu** — right-click for quick actions
- **Keyboard Shortcuts** — `N` new, `R` reorganize, `F` focus, `Del` delete

## Usage

Open `index.html` in a browser (requires internet for Three.js CDN).

No build step, no server required — just open the file.

## Stack

- [Three.js](https://threejs.org/) — 3D rendering
- [CSS2DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer) — HTML labels
- ES Modules with importmap

## License

MIT

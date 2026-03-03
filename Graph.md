# Graph Module Documentation

This module provides a visual editor for Graphs built with **Cytoscape.js** and **Paper.js**. It bridges a **Python-style backend** (deeply nested objects) and a **TypeScript/Zod frontend** (restricted to 2-level JSON nesting via pipe-delimited strings).

---

## 1. The Core Data Structures

### Frontend Schema (`Graph`)

The full graph type used internally by the editor.

```typescript
export interface Graph {
  nodes: Array<{
    id: string;
    label?: string;
    x?: number;
    y?: number;
    metadata: Record<string, any>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight?: number;   // currently unused
    label?: string;
    id?: string;
    metadata: Record<string, any>;
  }>;
  directed: boolean;
  weighted: boolean;   // currently unused
  multigraph: boolean; // currently unused
  metadata: Record<string, any>;
}
```

### Flattened Schema (`SimpleGraph`)

To satisfy the `jsonNestedSchema` (2-level nesting limit, Shimmy communication issues), nodes and edges are serialised as pipe-delimited strings.

```typescript
export interface SimpleGraph {
  nodes: string[];   // Format: "id|label|x|y"
  edges: string[];   // Format: "source|target|weight|label"
  directed: boolean;
  weighted: boolean;
  multigraph: boolean;
  evaluation_type: string[];
}
```

### Config Schema (`GraphConfig`)

Teacher-configured parameters stored separately in `config`, **not** in the answer.

```typescript
export interface GraphConfig {
  directed: boolean;
  weighted: boolean;
  multigraph: boolean;
  evaluation_type: string;  // e.g. 'connectivity', 'isomorphism', ...
}
```

### Answer Schema (`GraphAnswer`)

Topology-only answer — config flags are kept in `GraphConfig`, not here. Currently only used if `evaluation_type` is `isomorphim`.

```typescript
export interface GraphAnswer {
  nodes: string[];  // pipe-delimited node strings
  edges: string[];  // pipe-delimited edge strings
}
```

---

## 2. Key Components

### `Graph.component.tsx` — `GraphEditor`

The primary visual editor.

- **Rendering**: Uses **Cytoscape.js** for graph rendering and interaction.
- **Draw Mode**: Uses **Paper.js** (overlaid canvas) for freehand drawing:
  - **Draw a circle** → creates a new node at the circle's centre.
  - **Draw a line between nodes** → creates a new edge between the two closest nodes.
  - **Click two nodes** (while in draw mode) → creates an edge between them.
- **Selection**: Clicking a node or edge selects it, displaying its properties for editing in the side panel.
- **Sync**: Every mutation (add/delete/edit) calls `syncToGraph()`, which reads the Cytoscape state and fires `onChange(graph)`.

### `components/ConfigPanel.tsx`

Teacher-facing configuration panel.

- Toggle **Directed / Undirected**.
- Select an **Evaluation Type** (e.g. `isomorphism`, `connectivity`, `tree`, ...).
- For `isomorphism`, a second `GraphEditor` is rendered as the reference graph.

### `components/GraphFeedbackPanel.tsx`

`validateGraph()` makes some basic checks of graph for validation, however, this should be done by the backend. Even then, preview should be used from the back end for simple feedback, but not sure what good preview feedback there should be for Graph.

### `components/ItemPropertiesPanel.tsx`

Side panel for editing selected nodes/edges:

- Edit **Display Name** of a node.
- Edit **Edge Label**.
- **Delete** selected element.

---

## 3. Transformation Logic

Since the frontend editor and the backend see the data differently, conversion utilities are used at the network boundary.

| Function | Source | Target | Location |
|---|---|---|---|
| `toSimpleGraph()` | `Graph` | `SimpleGraph` | `type.ts` |
| `fromSimpleGraph()` | `SimpleGraph` | `Graph` | `type.ts` |
| `graphAnswerToSimple()` | `GraphAnswer` + `GraphConfig` | `SimpleGraph` | `type.ts` |
| `simpleToAnswer()` | `SimpleGraph` | `GraphAnswer` | `type.ts` |
| `GraphConverter.toBackend()` | `SimpleGraph` | `BackendGraph` | `utils.ts` |

---

## 4. Usage in the Pipeline

1. **Load**: Data is fetched from the backend as a flattened answer + config object.
2. **Convert**: `fromSimpleGraph(graphAnswerToSimple(answer, config))` reconstructs the rich `Graph` for the editor.
3. **Edit**: The user interacts with `GraphEditor`. Internal state stays in the rich `Graph` format.
4. **Save**: On change, `simpleToAnswer(toSimpleGraph(graph))` flattens the topology back. Config flags are merged directly into the answer object before sending to the backend:
   ```typescript
   const flatAnswer = {
     ...answer,
     directed: config.directed,
     weighted: config.weighted,
     multigraph: config.multigraph,
     evaluation_type: config.evaluation_type,
   }
   ```

---

## 5. Important Implementation Notes

- **Node IDs**: Nodes are auto-generated as `n0`, `n1`, `n2`, ... The counter tracks the highest existing ID to avoid duplicates on reload.
- **Edge IDs**: Generated as `` `e-${source}-${target}-${Date.now()}` `` to guarantee uniqueness, including in multigraphs.
- **Config is flattened into answer**: The backend reads `directed`, `weighted`, `multigraph`, and `evaluation_type` from the answer object, not from a separate config field. This is handled in `GraphResponseAreaTub.WizardComponent`.
- **Cytoscape vs Paper.js layering**: Paper.js canvas sits on top of Cytoscape (`zIndex: 10`) with `pointerEvents: none` when not in draw mode, and `pointerEvents: auto` + `cursor: crosshair` when draw mode is active.
- **Arrow direction**: The Cytoscape edge style `target-arrow-shape` is reactively updated whenever `graph.directed` changes.
- **Isomorphism mode**: When `evaluation_type === 'isomorphism'`, the Wizard renders a second `GraphEditor` for the teacher to define the reference graph.

---

## 6. Supported Evaluation Types

```
isomorphism, connectivity, bipartite, cycle_detection,
graph_coloring, planarity, tree, forest, dag, eulerian,
semi_eulerian, regular, complete, degree_sequence,
subgraph, hamiltonian_path, hamiltonian_cycle, clique_number
```

---

## 7. Dev Notice

There is a temporary folder `/dev` — all development work should be tested there.

Run `yarn vite` or `yarn dev` to start.

Note: for dev mode only, there is an extra config in `vite.config.ts`:

```json
root: 'dev', // for dev only
```

Remember to remove it before going to production.
import type { Core, NodeSingular, EdgeSingular } from 'cytoscape'
import React from 'react'

import { Graph } from '../type'

interface ItemPropertiesPanelProps {
  cyRef: React.MutableRefObject<Core | null>
  classes: Record<string, string>

  addNode: () => void

  drawMode: boolean
  setDrawMode: React.Dispatch<React.SetStateAction<boolean>>
  setFromNode: (id: string | null) => void

  selectedNode: NodeSingular | null
  setSelectedNode: (n: NodeSingular | null) => void

  selectedEdge: EdgeSingular | null
  setSelectedEdge: (e: EdgeSingular | null) => void

  graph: Graph
  handleChange: (graph: Graph) => void

  syncToBackend: () => void
}

export default function ItemPropertiesPanel({
  cyRef,
  classes,
  addNode,
  drawMode,
  setDrawMode,
  setFromNode,
  selectedNode,
  setSelectedNode,
  selectedEdge,
  setSelectedEdge,
  graph,
  handleChange,
  syncToBackend,
}: ItemPropertiesPanelProps): JSX.Element {
  return (
    <div className={classes.panel}>
      <div className={classes.panelTitle}>Item Properties</div>

      {/* -------------------- Actions -------------------- */}
      <button className={classes.addButton} onClick={addNode}>
        + Add Node
      </button>

      <button
        className={classes.addButton}
        onClick={() => {
          const cy = cyRef.current
          if (!cy) return
          cy.fit(undefined, 40)
        }}
      >
        Fit to Screen
      </button>

      <button
        className={classes.addButton}
        onClick={() => {
          setDrawMode((m) => !m)
          setFromNode(null)
          cyRef.current?.nodes().removeClass('edge-source edge-target')
        }}
      >
        {drawMode ? 'Cancel Draw' : 'Draw Edge'}
      </button>

      {/* -------------------- Node Properties -------------------- */}
      {selectedNode && (
        <div className={classes.field}>
          <label>Display Name</label>
          <input
            className={classes.inputField}
            value={selectedNode.data('displayLabel') ?? ''}
            onChange={(e) => {
              selectedNode.data('displayLabel', e.target.value)
              syncToBackend()
            }}
          />
        </div>
      )}

      {/* -------------------- Edge Properties -------------------- */}
      {selectedEdge && (
        <div className={classes.field}>
          <label>Edge Label</label>
          <input
            className={classes.inputField}
            value={selectedEdge.data('label') ?? ''}
            onChange={(e) => {
              selectedEdge.data('label', e.target.value)
              syncToBackend()
            }}
          />
        </div>
      )}

      {/* -------------------- Delete -------------------- */}
      {(selectedNode || selectedEdge) && (
        <button
          className={classes.deleteButton}
          onClick={() => {
            selectedNode?.remove()
            selectedEdge?.remove()
            setSelectedNode(null)
            setSelectedEdge(null)
            syncToBackend()
          }}
        >
          Delete Selected
        </button>
      )}
    </div>
  )
}

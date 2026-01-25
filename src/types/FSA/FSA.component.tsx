import { makeStyles } from '@styles';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import React, { useEffect, useRef, useState } from 'react';

import { FSA } from './type';

/* -------------------- styles -------------------- */
const useLocalStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    height: 600,
    display: 'flex',
    border: '1px solid #ddd',
    fontFamily: 'sans-serif',
  },
  panel: {
    width: 280,
    borderRight: '1px solid #ddd',
    padding: theme.spacing(2),
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  panelTitle: {
    fontWeight: 600,
    fontSize: 16,
    borderBottom: '1px solid #eee',
    paddingBottom: theme.spacing(1),
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  inputField: {
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  addButton: {
    padding: '6px 10px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  deleteButton: {
    padding: '6px',
    backgroundColor: '#fff1f0',
    color: '#cf1322',
    border: '1px solid #ffa39e',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
  },
  cyWrapper: {
    flexGrow: 1,
  },
}));

/* -------------------- component -------------------- */
interface FSAInputProps {
  answer: FSA;
  onChange: (val: FSA) => void;
}

export const FSAInput: React.FC<FSAInputProps> = ({ answer, onChange }) => {
  const { classes } = useLocalStyles();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  // State for UI and logic
  const [drawMode, setDrawMode] = useState(false);
  const [fromNodeId, setFromNodeId] = useState<string | null>(null);
  const [toNodeId, setToNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);

  /* -------------------- initialize cytoscape -------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      layout: { name: 'preset' },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(displayLabel)',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 50,
            height: 50,
            'background-color': '#fff',
            'border-width': 1,
            'border-color': '#555',
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'line-color': '#555',
            'target-arrow-color': '#555',
          },
        },
        {
          selector: '.edge-source',
          style: {
            'border-color': '#1890ff',
            'border-width': 3,
          },
        },
        {
          selector: '.edge-target',
          style: {
            'border-color': '#52c41a',
            'border-width': 3,
          },
        },
      ],
    });

    cyRef.current = cy;

    return () => cy.destroy();
  }, []);

  /* -------------------- attach handlers -------------------- */
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const handleNodeTap = (e: cytoscape.EventObject) => {
      const node = e.target as NodeSingular;

      if (drawMode) {
        if (!fromNodeId) {
          setFromNodeId(node.id());
          node.addClass('edge-source');
        } else if (!toNodeId) {
          setToNodeId(node.id());
          node.addClass('edge-target');
        }
        return;
      }

      setSelectedNode(node);
      setSelectedEdge(null);
    };

    const handleEdgeTap = (e: cytoscape.EventObject) => {
      if (drawMode) return;
      setSelectedEdge(e.target as EdgeSingular);
      setSelectedNode(null);
    };

    cy.on('tap', 'node', handleNodeTap);
    cy.on('tap', 'edge', handleEdgeTap);

    return () => {
      cy.off('tap', 'node', handleNodeTap);
      cy.off('tap', 'edge', handleEdgeTap);
    };
  }, [drawMode, fromNodeId, toNodeId]);

  /* -------------------- draw transition effect -------------------- */
  useEffect(() => {
    const cy = cyRef.current;
    if (!drawMode || !fromNodeId || !toNodeId || !cy) return;

    cy.add({
      group: 'edges',
      data: {
        id: `e-${fromNodeId}-${toNodeId}-${Date.now()}`,
        source: fromNodeId,
        target: toNodeId,
        label: 'a',
      },
    });

    cy.nodes().removeClass('edge-source edge-target');

    setDrawMode(false);
    setFromNodeId(null);
    setToNodeId(null);

    syncToAnswer();
  }, [drawMode, fromNodeId, toNodeId]);

  /* -------------------- helpers -------------------- */
  const syncToAnswer = () => {
    const cy = cyRef.current;
    if (!cy) return;

    const states = cy.nodes().map((n) => n.id());
    const transitions = cy
      .edges()
      .map((e) => `${e.source().id()}|${e.data('label') || 'ε'}|${e.target().id()}`);

    onChange({
      ...answer,
      states,
      transitions,
      alphabet: Array.from(
        new Set(transitions.map((t) => t.split('|')[1]).filter(s => s !== undefined)),
      ),
    });
  };

  const addState = () => {
    const cy = cyRef.current;
    if (!cy) return;

    const id = `q${cy.nodes().length}`;
    cy.add({
      group: 'nodes',
      data: { id, label: id, displayLabel: id },
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
    });

    syncToAnswer();
  };

  const deleteSelected = () => {
    selectedNode?.remove();
    selectedEdge?.remove();
    setSelectedNode(null);
    setSelectedEdge(null);
    syncToAnswer();
  };

  /* -------------------- render -------------------- */
  return (
    <div className={classes.container}>
      <div className={classes.panel}>
        <div className={classes.panelTitle}>Controls</div>

        <button className={classes.addButton} onClick={addState}>
          + Add State
        </button>

        <button
          className={classes.addButton}
          onClick={() => {
            const cy = cyRef.current;
            cy?.nodes().removeClass('edge-source edge-target');
            setDrawMode(!drawMode);
            setFromNodeId(null);
            setToNodeId(null);
          }}
        >
          {drawMode ? 'Exit Draw Mode' : 'Draw Transition'}
        </button>

        {drawMode && (
          <>
            <div className={classes.panelTitle}>From Node: {fromNodeId}</div>
            <div className={classes.panelTitle}>To Node: {toNodeId}</div>
          </>
        )}

        <div className={classes.panelTitle}>Item Properties</div>

        {/* Node Properties */}
        {selectedNode && (
          <>
            <div className={classes.field}>
              <label>Display Name</label>
              <input
                className={classes.inputField}
                value={selectedNode.data('displayLabel')}
                onChange={(e) => {
                  selectedNode.data('displayLabel', e.target.value);
                }}
              />
            </div>

            <div className={classes.checkboxRow}>
              <input
                type="checkbox"
                checked={answer.initial_state === selectedNode.id()}
                onChange={(e) =>
                  onChange({
                    ...answer,
                    initial_state: e.target.checked ? selectedNode.id() : '',
                  })
                }
              />
              <label>Initial State</label>
            </div>

            <div className={classes.checkboxRow}>
              <input
                type="checkbox"
                checked={answer.accept_states.includes(selectedNode.id())}
                onChange={(e) =>
                  onChange({
                    ...answer,
                    accept_states: e.target.checked
                      ? [...answer.accept_states, selectedNode.id()]
                      : answer.accept_states.filter((s) => s !== selectedNode.id()),
                  })
                }
              />
              <label>Accepting State</label>
            </div>

            <button className={classes.deleteButton} onClick={deleteSelected}>
              Delete State
            </button>
          </>
        )}

        {/* Edge Properties */}
        {selectedEdge && (
          <>
            <div className={classes.field}>
              <label>Transition Symbol</label>
              <input
                className={classes.inputField}
                value={String(selectedEdge.data('label') || '')}
                onChange={(e) => {
                  selectedEdge.data('label', e.target.value);
                  syncToAnswer();
                }}
              />
            </div>

            <button className={classes.deleteButton} onClick={deleteSelected}>
              Delete Transition
            </button>
          </>
        )}

        {!selectedNode && !selectedEdge && (
          <div style={{ color: '#999' }}>Select an element to edit</div>
        )}
      </div>

      <div ref={containerRef} className={classes.cyWrapper} />
    </div>
  );
};

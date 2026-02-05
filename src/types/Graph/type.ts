import { z } from "zod";

// -----------------------------
// Node Schema
// -----------------------------
export const NodeSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  partition: z.union([z.literal(0), z.literal(1)]).optional(),
  color: z.number().optional(),
  weight: z.number().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export type Node = z.infer<typeof NodeSchema>

// -----------------------------
// Edge Schema
// -----------------------------
export const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  weight: z.number().optional().default(1),
  capacity: z.number().optional(),
  flow: z.number().optional(),
  label: z.string().optional(),
  id: z.string().optional(),
  color: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export type Edge = z.infer<typeof EdgeSchema>

// -----------------------------
// Graph Schema
// -----------------------------
export const GraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema).default([]),
  directed: z.boolean().default(false),
  weighted: z.boolean().default(false),
  multigraph: z.boolean().default(false),
  name: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export type Graph = z.infer<typeof GraphSchema>

// -----------------------------
// Compressed Graph: JSON-stringified nodes/edges
// -----------------------------
export const CompressedGraphSchema = z.object({
  nodes: z.array(z.string()), // JSON.stringify(nodes)
  edges: z.array(z.string()), // JSON.stringify(edges)
  directed: z.boolean().default(false),
  weighted: z.boolean().default(false),
  multigraph: z.boolean().default(false),
  name: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export type CompressedGraph = z.infer<typeof CompressedGraphSchema>

// -----------------------------
// Example: compress function
// -----------------------------
export function compressGraph(graph: z.infer<typeof GraphSchema>) {
  return {
    ...graph,
    nodes: JSON.stringify(graph.nodes),
    edges: JSON.stringify(graph.edges),
  };
}

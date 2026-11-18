/**
 * JSON Graph Visualizer Type Definitions
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

export type JsonGraphNodeType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'root';

export interface JsonGraphNode {
  id: string;
  path: string;
  label: string;
  value: any;
  displayValue: string;
  type: JsonGraphNodeType;
  depth: number;
  parentId?: string;
  childIds: string[];
  isExpanded: boolean;
  childCount: number;

  // Render & Layout Coordinates
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface JsonGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface JsonGraphStats {
  totalNodes: number;
  maxDepth: number;
  objectCount: number;
  arrayCount: number;
  primitiveCount: number;
}

export interface JsonGraphModel {
  nodes: Map<string, JsonGraphNode>;
  edges: JsonGraphEdge[];
  rootId: string;
  stats: JsonGraphStats;
}

export interface GraphViewport {
  zoom: number;
  panX: number;
  panY: number;
}

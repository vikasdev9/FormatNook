/**
 * JSON Graph Visualizer Builder & Layout Service
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

import {
  JsonGraphEdge,
  JsonGraphModel,
  JsonGraphNode,
  JsonGraphNodeType,
  JsonGraphStats,
} from '../types/graph.types';

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 48;
export const HORIZ_GAP = 80;
export const VERT_GAP = 16;
export const MAX_SAFE_NODES = 5000;

export interface LayoutResult {
  visibleNodes: JsonGraphNode[];
  visibleEdges: JsonGraphEdge[];
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

/**
 * Derives JSON node type from raw value
 */
export function getGraphNodeType(value: any, isRoot: boolean = false): JsonGraphNodeType {
  if (isRoot) return 'root';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

/**
 * Format value preview for graph node badge
 */
export function formatValuePreview(value: any, type: JsonGraphNodeType): string {
  if (type === 'root') return '';
  if (type === 'null') return 'null';
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'number') return String(value);
  if (type === 'string') {
    const s = String(value);
    return s.length > 25 ? `"${s.substring(0, 22)}..."` : `"${s}"`;
  }
  if (type === 'array') return `Array(${value.length})`;
  if (type === 'object') return `Object(${Object.keys(value || {}).length})`;
  return String(value);
}

/**
 * Converts a raw JSON value into a graph model of nodes and edges
 */
export function buildGraphModel(
  data: any,
  options?: {
    maxNodes?: number;
    defaultExpandedDepth?: number;
  }
): JsonGraphModel {
  const maxNodes = options?.maxNodes ?? MAX_SAFE_NODES;
  const nodes = new Map<string, JsonGraphNode>();
  const edges: JsonGraphEdge[] = [];

  const stats: JsonGraphStats = {
    totalNodes: 0,
    maxDepth: 0,
    objectCount: 0,
    arrayCount: 0,
    primitiveCount: 0,
  };

  let nodeIdCounter = 0;

  function traverse(
    value: any,
    key: string,
    path: string,
    depth: number,
    parentId?: string,
    isRoot: boolean = false
  ): string | null {
    if (nodes.size >= maxNodes) {
      return null;
    }

    const currentId = `node_${nodeIdCounter++}`;
    const type = getGraphNodeType(value, isRoot);

    stats.totalNodes++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    if (type === 'object' || type === 'root') stats.objectCount++;
    else if (type === 'array') stats.arrayCount++;
    else stats.primitiveCount++;

    const isContainer = type === 'object' || type === 'array' || type === 'root';
    const childIds: string[] = [];

    const node: JsonGraphNode = {
      id: currentId,
      path,
      label: key || (isRoot ? 'root' : ''),
      value,
      displayValue: formatValuePreview(value, type),
      type,
      depth,
      parentId,
      childIds,
      isExpanded: true,
      childCount: 0,
      x: 0,
      y: 0,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };

    nodes.set(currentId, node);

    if (parentId) {
      edges.push({
        id: `edge_${parentId}_${currentId}`,
        sourceId: parentId,
        targetId: currentId,
        sourceX: 0,
        sourceY: 0,
        targetX: 0,
        targetY: 0,
      });
    }

    if (isContainer && value !== null) {
      if (Array.isArray(value)) {
        node.childCount = value.length;
        for (let i = 0; i < value.length; i++) {
          const childPath = `${path}[${i}]`;
          const childId = traverse(value[i], `[${i}]`, childPath, depth + 1, currentId, false);
          if (childId) {
            childIds.push(childId);
          }
          if (nodes.size >= maxNodes) break;
        }
      } else {
        const keys = Object.keys(value);
        node.childCount = keys.length;
        for (const k of keys) {
          const childPath = path ? `${path}.${k}` : `$.${k}`;
          const childId = traverse(value[k], k, childPath, depth + 1, currentId, false);
          if (childId) {
            childIds.push(childId);
          }
          if (nodes.size >= maxNodes) break;
        }
      }
    }

    return currentId;
  }

  const rootId = traverse(data, 'root', '$', 0, undefined, true) || 'node_0';

  return {
    nodes,
    edges,
    rootId,
    stats,
  };
}

/**
 * Computes tree layout coordinates (x, y) for all visible nodes given the expandedSet.
 * Uses post-order traversal to calculate subtree height and vertically center parent nodes.
 */
export function layoutGraph(
  model: JsonGraphModel,
  expandedSet: Set<string>
): LayoutResult {
  const visibleNodes: JsonGraphNode[] = [];
  const visibleNodeMap = new Map<string, JsonGraphNode>();
  const visibleEdges: JsonGraphEdge[] = [];

  const root = model.nodes.get(model.rootId);
  if (!root) {
    return {
      visibleNodes: [],
      visibleEdges: [],
      boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  let currentY = 40;

  // Post-order layout recursion: compute y for children, then center parent
  function layoutSubtree(nodeId: string, depth: number): number {
    const node = model.nodes.get(nodeId);
    if (!node) return currentY;

    const isExpanded = expandedSet.has(nodeId);
    const visibleChildren = isExpanded ? node.childIds.filter((cid) => model.nodes.has(cid)) : [];

    // X coordinate based on hierarchy depth
    const x = 40 + depth * (NODE_WIDTH + HORIZ_GAP);

    let nodeY: number;

    if (visibleChildren.length === 0) {
      // Leaf node or collapsed container: allocate vertical slot
      nodeY = currentY;
      currentY += NODE_HEIGHT + VERT_GAP;
    } else {
      // Container node with visible children: recurse on all children
      const childYPositions: number[] = [];
      for (const childId of visibleChildren) {
        const cy = layoutSubtree(childId, depth + 1);
        childYPositions.push(cy);
      }
      // Center parent vertically between first and last child
      const minY = childYPositions[0];
      const maxY = childYPositions[childYPositions.length - 1];
      nodeY = (minY + maxY) / 2;
    }

    const layoutNode: JsonGraphNode = {
      ...node,
      x,
      y: nodeY,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      isExpanded,
    };

    visibleNodes.push(layoutNode);
    visibleNodeMap.set(node.id, layoutNode);
    return nodeY;
  }

  layoutSubtree(root.id, 0);

  // Filter and compute edge coordinates for visible nodes
  for (const edge of model.edges) {
    const sourceNode = visibleNodeMap.get(edge.sourceId);
    const targetNode = visibleNodeMap.get(edge.targetId);

    if (sourceNode && targetNode) {
      visibleEdges.push({
        id: edge.id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        sourceX: sourceNode.x + sourceNode.width,
        sourceY: sourceNode.y + sourceNode.height / 2,
        targetX: targetNode.x,
        targetY: targetNode.y + targetNode.height / 2,
      });
    }
  }

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (visibleNodes.length === 0) {
    minX = minY = maxX = maxY = 0;
  } else {
    for (const n of visibleNodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
  }

  const width = Math.max(100, maxX - minX + 80);
  const height = Math.max(100, maxY - minY + 80);

  return {
    visibleNodes,
    visibleEdges,
    boundingBox: { minX, minY, maxX, maxY, width, height },
  };
}

/**
 * Searches nodes by key, path, or value matching query (case-insensitive)
 */
export function searchGraph(model: JsonGraphModel, query: string): Set<string> {
  const matches = new Set<string>();
  const q = query.trim().toLowerCase();
  if (!q) return matches;

  for (const [id, node] of model.nodes.entries()) {
    const matchLabel = node.label.toLowerCase().includes(q);
    const matchPath = node.path.toLowerCase().includes(q);
    const matchVal = node.displayValue.toLowerCase().includes(q);

    if (matchLabel || matchPath || matchVal) {
      matches.add(id);
    }
  }

  return matches;
}

/**
 * Computes optimal zoom and pan coordinates to fit the graph within viewport
 */
export function calculateFitToScreen(
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 40
): { zoom: number; panX: number; panY: number } {
  if (boundingBox.width <= 0 || boundingBox.height <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { zoom: 1, panX: 0, panY: 0 };
  }

  const availWidth = Math.max(100, viewportWidth - padding * 2);
  const availHeight = Math.max(100, viewportHeight - padding * 2);

  const scaleX = availWidth / boundingBox.width;
  const scaleY = availHeight / boundingBox.height;
  const rawZoom = Math.min(scaleX, scaleY);
  const zoom = Math.min(Math.max(rawZoom, 0.15), 1.5); // Clamp zoom between 0.15 and 1.5

  const graphCenterX = boundingBox.minX + boundingBox.width / 2;
  const graphCenterY = boundingBox.minY + boundingBox.height / 2;

  const panX = viewportWidth / 2 - graphCenterX * zoom;
  const panY = viewportHeight / 2 - graphCenterY * zoom;

  return { zoom, panX, panY };
}

/**
 * Generates an SVG string representation of the current graph layout for download
 */
export function exportGraphToSvg(
  visibleNodes: JsonGraphNode[],
  visibleEdges: JsonGraphEdge[],
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number },
  isDark: boolean
): string {
  const pad = 40;
  const vbX = boundingBox.minX - pad;
  const vbY = boundingBox.minY - pad;
  const vbW = boundingBox.width + pad * 2;
  const vbH = boundingBox.height + pad * 2;

  const bg = isDark ? '#0f172a' : '#ffffff';
  const nodeBg = isDark ? '#1e293b' : '#f8fafc';
  const nodeBorder = isDark ? '#334155' : '#cbd5e1';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const edgeColor = isDark ? '#475569' : '#94a3b8';

  const typeColors: Record<JsonGraphNodeType, string> = {
    root: '#3b82f6',
    object: '#6366f1',
    array: '#8b5cf6',
    string: '#10b981',
    number: '#f59e0b',
    boolean: '#ec4899',
    null: '#64748b',
  };

  const edgesSvg = visibleEdges
    .map((e) => {
      const dx = Math.abs(e.targetX - e.sourceX) * 0.5;
      const d = `M ${e.sourceX} ${e.sourceY} C ${e.sourceX + dx} ${e.sourceY}, ${e.targetX - dx} ${e.targetY}, ${e.targetX} ${e.targetY}`;
      return `<path d="${d}" fill="none" stroke="${edgeColor}" stroke-width="2" stroke-linecap="round" />`;
    })
    .join('\n');

  const nodesSvg = visibleNodes
    .map((n) => {
      const badgeColor = typeColors[n.type] || '#64748b';
      const cleanLabel = (n.label || '').replace(/[<>&"]/g, '');
      const cleanVal = (n.displayValue || '').replace(/[<>&"]/g, '');

      return `
      <g transform="translate(${n.x}, ${n.y})">
        <rect width="${n.width}" height="${n.height}" rx="8" fill="${nodeBg}" stroke="${nodeBorder}" stroke-width="1.5" />
        <rect x="0" y="0" width="4" height="${n.height}" rx="2" fill="${badgeColor}" />
        <text x="12" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${textPrimary}">${cleanLabel}</text>
        <text x="12" y="38" font-family="monospace" font-size="11" fill="${textMuted}">${cleanVal}</text>
        <rect x="${n.width - 52}" y="12" width="44" height="18" rx="4" fill="${badgeColor}" fill-opacity="0.15" />
        <text x="${n.width - 30}" y="24" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="${badgeColor}" text-anchor="middle" dominant-baseline="middle">${n.type.toUpperCase()}</text>
      </g>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${vbW}" height="${vbH}">
  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bg}" />
  <g id="edges">${edgesSvg}</g>
  <g id="nodes">${nodesSvg}</g>
</svg>`;
}

/**
 * Exports SVG string to PNG Blob using client Canvas
 */
export async function exportGraphToPng(
  svgString: string,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(800, width);
        canvas.height = Math.max(600, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, 'image/png');
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

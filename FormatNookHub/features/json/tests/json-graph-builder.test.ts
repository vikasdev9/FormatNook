import { describe, it, expect } from 'vitest';
import {
  buildGraphModel,
  layoutGraph,
  searchGraph,
  calculateFitToScreen,
  exportGraphToSvg,
  getGraphNodeType,
  formatValuePreview,
} from '../services/json-graph-builder';

describe('JSON Graph Builder & Layout Engine', () => {
  const sampleJson = {
    id: 1,
    name: 'Test Project',
    isActive: true,
    tags: ['react', 'nextjs'],
    metadata: {
      owner: {
        username: 'octocat',
        email: null,
      },
    },
  };

  it('correctly categorizes node types and display previews', () => {
    expect(getGraphNodeType({}, true)).toBe('root');
    expect(getGraphNodeType(null)).toBe('null');
    expect(getGraphNodeType([])).toBe('array');
    expect(getGraphNodeType({})).toBe('object');
    expect(getGraphNodeType('hello')).toBe('string');
    expect(getGraphNodeType(123)).toBe('number');
    expect(getGraphNodeType(true)).toBe('boolean');

    expect(formatValuePreview('short', 'string')).toBe('"short"');
    expect(formatValuePreview('a very very very long string that should truncate', 'string')).toContain('...');
    expect(formatValuePreview(true, 'boolean')).toBe('true');
    expect(formatValuePreview(123, 'number')).toBe('123');
    expect(formatValuePreview(null, 'null')).toBe('null');
    expect(formatValuePreview(['a', 'b'], 'array')).toBe('Array(2)');
    expect(formatValuePreview({ a: 1 }, 'object')).toBe('Object(1)');
  });

  it('builds a complete graph model with nodes, edges, and statistics', () => {
    const model = buildGraphModel(sampleJson);

    expect(model.rootId).toBe('node_0');
    expect(model.nodes.size).toBeGreaterThan(5);
    expect(model.edges.length).toBe(model.nodes.size - 1); // Tree property: edges = nodes - 1

    expect(model.stats.totalNodes).toBe(model.nodes.size);
    expect(model.stats.maxDepth).toBeGreaterThanOrEqual(3);
    expect(model.stats.objectCount).toBeGreaterThanOrEqual(2);
    expect(model.stats.arrayCount).toBeGreaterThanOrEqual(1);
    expect(model.stats.primitiveCount).toBeGreaterThanOrEqual(4);

    // Root node checks
    const root = model.nodes.get(model.rootId);
    expect(root).toBeDefined();
    expect(root?.type).toBe('root');
    expect(root?.path).toBe('$');
    expect(root?.childIds.length).toBe(5); // id, name, isActive, tags, metadata
  });

  it('computes hierarchical layout with visible nodes and valid bezier edges', () => {
    const model = buildGraphModel(sampleJson);
    const expandedSet = new Set(model.nodes.keys());

    const layout = layoutGraph(model, expandedSet);

    expect(layout.visibleNodes.length).toBe(model.nodes.size);
    expect(layout.visibleEdges.length).toBe(model.edges.length);

    // Verify bounding box
    expect(layout.boundingBox.width).toBeGreaterThan(0);
    expect(layout.boundingBox.height).toBeGreaterThan(0);
    expect(layout.boundingBox.minX).toBe(40);

    // Verify root is positioned at x = 40
    const rootLayout = layout.visibleNodes.find((n) => n.id === model.rootId);
    expect(rootLayout?.x).toBe(40);
  });

  it('supports collapsing and expanding subtrees', () => {
    const model = buildGraphModel(sampleJson);

    // Find the metadata node
    const metadataNode = Array.from(model.nodes.values()).find((n) => n.label === 'metadata');
    expect(metadataNode).toBeDefined();

    // Layout with all expanded
    const allExpandedSet = new Set(model.nodes.keys());
    const layoutExpanded = layoutGraph(model, allExpandedSet);

    // Layout with metadata collapsed (remove metadata and its children from expandedSet)
    const collapsedSet = new Set(model.nodes.keys());
    collapsedSet.delete(metadataNode!.id);

    const layoutCollapsed = layoutGraph(model, collapsedSet);

    // Children of metadata should not be visible
    expect(layoutCollapsed.visibleNodes.length).toBeLessThan(layoutExpanded.visibleNodes.length);
    const ownerNodeVisible = layoutCollapsed.visibleNodes.some((n) => n.label === 'owner');
    expect(ownerNodeVisible).toBe(false);
  });

  it('correctly filters nodes by search query matching key, path, or value', () => {
    const model = buildGraphModel(sampleJson);

    const matchUsername = searchGraph(model, 'octocat');
    expect(matchUsername.size).toBe(1);

    const matchTags = searchGraph(model, 'tags');
    expect(matchTags.size).toBeGreaterThanOrEqual(1);

    const matchBoolean = searchGraph(model, 'true');
    expect(matchBoolean.size).toBe(1);

    const emptyMatch = searchGraph(model, 'nonexistent_query_xyz');
    expect(emptyMatch.size).toBe(0);
  });

  it('calculates fit-to-screen scale and pan coordinates', () => {
    const boundingBox = {
      minX: 40,
      minY: 40,
      maxX: 800,
      maxY: 600,
      width: 760,
      height: 560,
    };

    const fit = calculateFitToScreen(boundingBox, 1000, 800, 40);
    expect(fit.zoom).toBeGreaterThan(0);
    expect(fit.zoom).toBeLessThanOrEqual(1.5);
    expect(typeof fit.panX).toBe('number');
    expect(typeof fit.panY).toBe('number');
  });

  it('exports graph to standard SVG markup with nodes and edges', () => {
    const model = buildGraphModel(sampleJson);
    const expandedSet = new Set(model.nodes.keys());
    const layout = layoutGraph(model, expandedSet);

    const svg = exportGraphToSvg(layout.visibleNodes, layout.visibleEdges, layout.boundingBox, true);
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('<g id="edges">');
    expect(svg).toContain('<g id="nodes">');
    expect(svg).toContain('Test Project');
  });

  it('enforces maximum node safety limits for large JSON datasets', () => {
    const largeObj: Record<string, any> = {};
    for (let i = 0; i < 200; i++) {
      largeObj[`key_${i}`] = { sub: i, val: `str_${i}` };
    }

    const model = buildGraphModel(largeObj, { maxNodes: 50 });
    expect(model.nodes.size).toBeLessThanOrEqual(51);
  });
});

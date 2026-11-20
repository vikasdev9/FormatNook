'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  X,
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  FileCode,
} from 'lucide-react';
import {
  JsonGraphModel,
  JsonGraphNode,
  GraphViewport,
  JsonGraphNodeType,
} from '../types/graph.types';
import {
  buildGraphModel,
  layoutGraph,
  searchGraph,
  calculateFitToScreen,
  exportGraphToSvg,
  exportGraphToPng,
  MAX_SAFE_NODES,
} from '../services/json-graph-builder';
import { downloadFile } from '@/lib/download';

interface JsonGraphViewProps {
  data: any;
  isDark?: boolean;
}

export function JsonGraphView({ data, isDark = true }: JsonGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected node state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'path' | 'value' | null>(null);

  // Viewport zoom & pan
  const [viewport, setViewport] = useState<GraphViewport>({
    zoom: 1,
    panX: 40,
    panY: 40,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 40,
    panY: 40,
  });

  // Export dropdown state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Build graph model
  const graphModel = useMemo<JsonGraphModel>(() => {
    return buildGraphModel(data, { maxNodes: MAX_SAFE_NODES });
  }, [data]);

  // Expanded set state
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // If graph is small (<= 80 nodes), expand all by default; otherwise expand depth <= 1
    const shouldExpandAll = graphModel.stats.totalNodes <= 80;
    for (const [id, node] of graphModel.nodes.entries()) {
      if (shouldExpandAll || node.depth <= 1) {
        initial.add(id);
      }
    }
    return initial;
  });

  // Sync expanded set when data / model changes
  useEffect(() => {
    const initial = new Set<string>();
    const shouldExpandAll = graphModel.stats.totalNodes <= 80;
    for (const [id, node] of graphModel.nodes.entries()) {
      if (shouldExpandAll || node.depth <= 1) {
        initial.add(id);
      }
    }
    setExpandedSet(initial);
    setSelectedNodeId(graphModel.rootId);
  }, [graphModel]);

  // Layout calculation
  const layout = useMemo(() => {
    return layoutGraph(graphModel, expandedSet);
  }, [graphModel, expandedSet]);

  // Search matches
  const searchMatches = useMemo(() => {
    return searchGraph(graphModel, searchQuery);
  }, [graphModel, searchQuery]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return layout.visibleNodes.find((n) => n.id === selectedNodeId) || graphModel.nodes.get(selectedNodeId) || null;
  }, [selectedNodeId, layout.visibleNodes, graphModel.nodes]);

  // Fit to screen helper
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const fit = calculateFitToScreen(layout.boundingBox, clientWidth, clientHeight, 60);
    setViewport(fit);
  }, [layout.boundingBox]);

  // Initial fit to screen on mount
  useEffect(() => {
    handleFitToScreen();
  }, [handleFitToScreen]);

  // Zoom handlers
  const handleZoomIn = () => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.25, 2.5),
    }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.25, 0.15),
    }));
  };

  const handleResetZoom = () => {
    setViewport({ zoom: 1, panX: 60, panY: 60 });
  };

  // Expand / Collapse All
  const handleExpandAll = () => {
    const all = new Set<string>(graphModel.nodes.keys());
    setExpandedSet(all);
  };

  const handleCollapseAll = () => {
    const rootOnly = new Set<string>();
    if (graphModel.rootId) rootOnly.add(graphModel.rootId);
    setExpandedSet(rootOnly);
  };

  const handleToggleNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: viewport.panX,
      panY: viewport.panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setViewport((prev) => ({
      ...prev,
      panX: dragStartRef.current.panX + dx,
      panY: dragStartRef.current.panY + dy,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.15), 2.5);

    // Zoom towards mouse position
    const nextPanX = mouseX - (mouseX - viewport.panX) * (nextZoom / viewport.zoom);
    const nextPanY = mouseY - (mouseY - viewport.panY) * (nextZoom / viewport.zoom);

    setViewport({
      zoom: nextZoom,
      panX: nextPanX,
      panY: nextPanY,
    });
  };

  // Copy helpers
  const handleCopyPath = () => {
    if (!selectedNode) return;
    navigator.clipboard.writeText(selectedNode.path);
    setCopiedType('path');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyValue = () => {
    if (!selectedNode) return;
    const text = typeof selectedNode.value === 'object'
      ? JSON.stringify(selectedNode.value, null, 2)
      : String(selectedNode.value);
    navigator.clipboard.writeText(text);
    setCopiedType('value');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Export handlers
  const handleExportSvg = () => {
    const svgStr = exportGraphToSvg(layout.visibleNodes, layout.visibleEdges, layout.boundingBox, isDark);
    downloadFile(svgStr, 'formatnook-json-graph.svg', 'image/svg+xml;charset=utf-8');
    setIsExportMenuOpen(false);
  };

  const handleExportPng = async () => {
    try {
      const svgStr = exportGraphToSvg(layout.visibleNodes, layout.visibleEdges, layout.boundingBox, isDark);
      const blob = await exportGraphToPng(svgStr, layout.boundingBox.width, layout.boundingBox.height);
      downloadFile(blob, 'formatnook-json-graph.png', 'image/png');
    } catch (e) {
      console.error('Failed to export PNG', e);
    }
    setIsExportMenuOpen(false);
  };

  // Color mappings for badges
  const getNodeColor = (type: JsonGraphNodeType): string => {
    switch (type) {
      case 'root': return 'var(--accent-primary, #3b82f6)';
      case 'object': return '#6366f1';
      case 'array': return '#8b5cf6';
      case 'string': return '#10b981';
      case 'number': return '#f59e0b';
      case 'boolean': return '#ec4899';
      case 'null':
      default: return '#64748b';
    }
  };

  return (
    <div className="json-graph-view-wrapper" data-testid="json-graph-visualizer">
      {/* Top Controls Toolbar */}
      <div className="json-graph-toolbar">
        {/* Search */}
        <div className="json-graph-search">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="json-graph-search-input"
            placeholder="Search nodes, keys, values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="json-graph-search-input"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
          {searchQuery && (
            <span className="search-badge" data-testid="json-graph-search-count">
              {searchMatches.size} match{searchMatches.size === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        {/* Tree Expand / Collapse All */}
        <div className="json-graph-btn-group">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExpandAll}
            title="Expand All Nodes"
            data-testid="json-graph-expand-all"
          >
            Expand All
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCollapseAll}
            title="Collapse All Nodes"
            data-testid="json-graph-collapse-all"
          >
            Collapse All
          </button>
        </div>

        {/* Zoom & Viewport Controls */}
        <div className="json-graph-btn-group">
          <button
            className="btn btn-secondary btn-icon-only btn-sm"
            onClick={handleZoomIn}
            title="Zoom In"
            data-testid="json-graph-zoom-in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="btn btn-secondary btn-icon-only btn-sm"
            onClick={handleZoomOut}
            title="Zoom Out"
            data-testid="json-graph-zoom-out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="btn btn-secondary btn-icon-only btn-sm"
            onClick={handleFitToScreen}
            title="Fit to Screen"
            data-testid="json-graph-fit-screen"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="btn btn-secondary btn-icon-only btn-sm"
            onClick={handleResetZoom}
            title="Reset Zoom (100%)"
            data-testid="json-graph-reset-zoom"
          >
            <RotateCcw size={14} />
          </button>
          <span className="zoom-percentage-badge">
            {Math.round(viewport.zoom * 100)}%
          </span>
        </div>

        {/* Export Dropdown */}
        <div className="json-graph-export-wrapper">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            data-testid="json-graph-export-btn"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {isExportMenuOpen && (
            <div className="json-graph-export-menu" data-testid="json-graph-export-menu">
              <button
                className="export-menu-item"
                onClick={handleExportSvg}
                data-testid="json-graph-export-svg"
              >
                <FileCode size={14} />
                <span>Export as SVG</span>
              </button>
              <button
                className="export-menu-item"
                onClick={handleExportPng}
                data-testid="json-graph-export-png"
              >
                <Download size={14} />
                <span>Export as PNG</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Summary Pill */}
        <div className="json-graph-stats" data-testid="json-graph-stats">
          <span className="stat-pill" title="Total Nodes">
            <strong>{graphModel.stats.totalNodes}</strong> nodes
          </span>
          <span className="stat-pill" title="Max Nesting Depth">
            depth <strong>{graphModel.stats.maxDepth}</strong>
          </span>
        </div>
      </div>

      {/* Safety Banner if Truncated */}
      {graphModel.stats.totalNodes >= MAX_SAFE_NODES && (
        <div className="json-graph-safety-banner">
          <Info size={14} />
          <span>Graph visualizer limited to {MAX_SAFE_NODES} nodes for optimal rendering performance.</span>
        </div>
      )}

      {/* Interactive SVG Canvas Area */}
      <div
        ref={containerRef}
        className={`json-graph-canvas-container ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        data-testid="json-graph-canvas"
      >
        <svg
          className="json-graph-svg"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <g
            transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}
          >
            {/* Edges */}
            <g className="json-graph-edges">
              {layout.visibleEdges.map((edge) => {
                const dx = Math.abs(edge.targetX - edge.sourceX) * 0.5;
                const pathD = `M ${edge.sourceX} ${edge.sourceY} C ${edge.sourceX + dx} ${edge.sourceY}, ${edge.targetX - dx} ${edge.targetY}, ${edge.targetX} ${edge.targetY}`;
                return (
                  <path
                    key={edge.id}
                    d={pathD}
                    className="json-graph-edge-path"
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g className="json-graph-nodes">
              {layout.visibleNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isMatch = searchMatches.has(node.id);
                const isContainer = node.type === 'object' || node.type === 'array' || node.type === 'root';
                const hasChildren = node.childCount > 0;
                const color = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className={`json-graph-node-group ${isSelected ? 'selected' : ''} ${isMatch ? 'search-match' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    data-testid={`json-graph-node-${node.id}`}
                  >
                    {/* Node Background Card */}
                    <rect
                      width={node.width}
                      height={node.height}
                      rx={8}
                      className="node-rect-bg"
                    />

                    {/* Left Accent Stripe */}
                    <rect
                      x={0}
                      y={0}
                      width={4}
                      height={node.height}
                      rx={2}
                      fill={color}
                    />

                    {/* Node Label / Key */}
                    <text
                      x={14}
                      y={20}
                      className="node-label-text"
                    >
                      {node.label}
                    </text>

                    {/* Node Display Value */}
                    <text
                      x={14}
                      y={38}
                      className="node-value-text"
                    >
                      {node.displayValue}
                    </text>

                    {/* Type Badge */}
                    <g transform={`translate(${node.width - 56}, 10)`}>
                      <rect
                        width={46}
                        height={16}
                        rx={3}
                        className="node-type-badge-bg"
                        fill={color}
                        fillOpacity={0.15}
                      />
                      <text
                        x={23}
                        y={11}
                        textAnchor="middle"
                        className="node-type-badge-text"
                        fill={color}
                      >
                        {node.type.toUpperCase()}
                      </text>
                    </g>

                    {/* Expand / Collapse Button for Containers */}
                    {isContainer && hasChildren && (
                      <g
                        transform={`translate(${node.width - 20}, ${node.height / 2})`}
                        className="node-expand-toggle"
                        onClick={(e) => handleToggleNode(e, node.id)}
                        data-testid={`node-toggle-${node.id}`}
                      >
                        <circle r={8} className="toggle-circle" />
                        {node.isExpanded ? (
                          <text x={0} y={3} textAnchor="middle" className="toggle-symbol">-</text>
                        ) : (
                          <text x={0} y={3} textAnchor="middle" className="toggle-symbol">+</text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Selected Node JSONPath Inspector Bar */}
      {selectedNode && (
        <div className="json-graph-inspector" data-testid="json-graph-inspector">
          <div className="inspector-node-info">
            <span
              className="inspector-type-badge"
              style={{ backgroundColor: `${getNodeColor(selectedNode.type)}22`, color: getNodeColor(selectedNode.type) }}
            >
              {selectedNode.type.toUpperCase()}
            </span>
            <span className="inspector-path-label">JSONPath:</span>
            <code className="inspector-path-code" data-testid="inspector-jsonpath">
              {selectedNode.path}
            </code>
          </div>

          <div className="inspector-actions">
            <button
              className="btn btn-secondary btn-xs"
              onClick={handleCopyPath}
              title="Copy JSONPath"
              data-testid="inspector-copy-path"
            >
              {copiedType === 'path' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              <span>{copiedType === 'path' ? 'Copied Path' : 'Copy JSONPath'}</span>
            </button>
            <button
              className="btn btn-secondary btn-xs"
              onClick={handleCopyValue}
              title="Copy Node Value"
              data-testid="inspector-copy-value"
            >
              {copiedType === 'value' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              <span>{copiedType === 'value' ? 'Copied Value' : 'Copy Value'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2,
  FolderTree,
  ArrowUp,
  ArrowDown,
  Layers,
  Edit3,
} from 'lucide-react';
import { YamlDataType, YamlTreeNode } from '../types/yaml.types';
import { useClipboard } from '@/hooks/useClipboard';

interface YamlTreeViewProps {
  nodes: YamlTreeNode[];
  onSelectPath?: (path: string) => void;
  onEditValue?: (path: string, newValue: any, docIndex: number) => void;
}

export function YamlTreeView({ nodes, onSelectPath, onEditValue }: YamlTreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    nodes.forEach((n) => initial.add(n.id));
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'keys' | 'values'>('all');
  const [activeNodeId, setActiveNodeId] = useState<string>('');
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<string>('');

  const { copy } = useClipboard();

  const toggleExpand = useCallback((id: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const ids = new Set<string>();
    function traverse(node: YamlTreeNode) {
      ids.add(node.id);
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
    nodes.forEach(traverse);
    setExpandedPaths(ids);
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const expandOneLevel = useCallback(() => {
    const ids = new Set<string>();
    nodes.forEach((n) => {
      ids.add(n.id);
      if (n.children) {
        n.children.forEach((c) => ids.add(c.id));
      }
    });
    setExpandedPaths(ids);
  }, [nodes]);

  // Flatten searchable nodes
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = isCaseSensitive ? searchQuery : searchQuery.toLowerCase();
    const matches: { id: string; path: string }[] = [];

    function searchInNode(node: YamlTreeNode) {
      let isMatch = false;
      const keyStr = isCaseSensitive ? node.key : node.key.toLowerCase();
      const valStr =
        node.value !== null && node.value !== undefined
          ? isCaseSensitive
            ? String(node.value)
            : String(node.value).toLowerCase()
          : '';

      const matchText = (target: string) =>
        isExactMatch ? target === query : target.includes(query);

      if (searchScope === 'all' || searchScope === 'keys') {
        if (matchText(keyStr) || matchText(node.path.toLowerCase())) {
          isMatch = true;
        }
      }

      if ((searchScope === 'all' || searchScope === 'values') && !isMatch) {
        if (node.type !== 'object' && node.type !== 'array' && matchText(valStr)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        matches.push({ id: node.id, path: node.path });
      }

      if (node.children) {
        node.children.forEach(searchInNode);
      }
    }

    nodes.forEach(searchInNode);
    return matches;
  }, [nodes, searchQuery, isCaseSensitive, isExactMatch, searchScope]);

  const goToNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % searchMatches.length;
    setActiveMatchIndex(nextIdx);
    const target = searchMatches[nextIdx];
    setActiveNodeId(target.id);

    // Auto expand ancestors
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      function expandAncestors(curNode: YamlTreeNode, targetId: string): boolean {
        if (curNode.id === targetId) return true;
        if (curNode.children) {
          for (const c of curNode.children) {
            if (expandAncestors(c, targetId)) {
              next.add(curNode.id);
              return true;
            }
          }
        }
        return false;
      }
      nodes.forEach((n) => expandAncestors(n, target.id));
      return next;
    });
  }, [searchMatches, activeMatchIndex, nodes]);

  const goToPrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setActiveMatchIndex(prevIdx);
    const target = searchMatches[prevIdx];
    setActiveNodeId(target.id);
  }, [searchMatches, activeMatchIndex]);

  const handleCopy = (text: string, actionId: string) => {
    copy(text);
    setCopiedAction(actionId);
    setTimeout(() => setCopiedAction(null), 1500);
  };

  const handleStartEdit = (node: YamlTreeNode) => {
    setEditingNodeId(node.id);
    setEditingVal(node.value !== null && node.value !== undefined ? String(node.value) : '');
  };

  const handleCommitEdit = (node: YamlTreeNode) => {
    if (!onEditValue) return;

    let parsedVal: any = editingVal;
    if (editingVal.trim() === 'true') parsedVal = true;
    else if (editingVal.trim() === 'false') parsedVal = false;
    else if (editingVal.trim() === 'null') parsedVal = null;
    else if (!isNaN(Number(editingVal)) && editingVal.trim() !== '') {
      parsedVal = Number(editingVal);
    }

    onEditValue(node.path, parsedVal, node.docIndex);
    setEditingNodeId(null);
  };

  // Render node recursive helper
  const renderTreeNode = (node: YamlTreeNode) => {
    const isExpanded = expandedPaths.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isActive = activeNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const isSearchMatch = searchMatches.some((m) => m.id === node.id);

    return (
      <div key={node.id} className="tree-node-wrapper">
        <div
          className={`tree-node-row ${isActive ? 'tree-active' : ''} ${
            isSearchMatch ? 'tree-search-match' : ''
          }`}
          style={{ paddingLeft: `${node.depth * 18 + 8}px` }}
          onClick={() => {
            setActiveNodeId(node.id);
            if (onSelectPath) onSelectPath(node.path);
          }}
        >
          {/* Expand/Collapse Toggle Button */}
          {hasChildren ? (
            <button
              type="button"
              className="tree-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="tree-leaf-spacer" />
          )}

          {/* Key Identifier */}
          <span className="tree-node-key" title={node.path}>
            {node.key}
          </span>
          <span className="tree-colon">:</span>

          {/* Type Pill */}
          <span className={`tree-type-pill tree-pill-${node.type}`}>
            {node.type}
            {node.itemCount !== undefined && ` (${node.itemCount})`}
          </span>

          {/* Node Value or Container summary */}
          <div className="tree-node-value-container">
            {isEditing ? (
              <div className="inline-edit-box" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  className="inline-edit-input"
                  value={editingVal}
                  onChange={(e) => setEditingVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitEdit(node);
                    if (e.key === 'Escape') setEditingNodeId(null);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => handleCommitEdit(node)}
                  title="Save change"
                >
                  <Check size={12} className="text-success" />
                </button>
              </div>
            ) : hasChildren ? (
              <span className="tree-node-meta">
                {node.type === 'array' ? `[${node.itemCount} items]` : `{${node.itemCount} keys}`}
              </span>
            ) : (
              <span className={`tree-node-value tree-type-${node.type}`}>
                {node.type === 'string'
                  ? `"${node.value}"`
                  : String(node.value)}
              </span>
            )}
          </div>

          {/* Hover Actions: Copy Value, Copy Path, Edit */}
          <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
            {onEditValue && !hasChildren && !isEditing && (
              <button
                type="button"
                className="tree-action-btn"
                title="Edit scalar value"
                onClick={() => handleStartEdit(node)}
              >
                <Edit3 size={11} />
              </button>
            )}

            <button
              type="button"
              className="tree-action-btn"
              title={`Copy Path: ${node.path}`}
              onClick={() => handleCopy(node.path, `path-${node.id}`)}
            >
              {copiedAction === `path-${node.id}` ? (
                <Check size={11} className="text-success" />
              ) : (
                <span style={{ fontSize: '10px' }}>path</span>
              )}
            </button>

            {!hasChildren && (
              <button
                type="button"
                className="tree-action-btn"
                title="Copy Value"
                onClick={() => handleCopy(String(node.value), `val-${node.id}`)}
              >
                {copiedAction === `val-${node.id}` ? (
                  <Check size={11} className="text-success" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Children Rows */}
        {hasChildren && isExpanded && (
          <div className="tree-node-children">
            {node.children!.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="json-tree-container" data-testid="yaml-tree-view">
      {/* Top Search & Navigation Bar */}
      <div className="json-tree-toolbar">
        <div className="tree-search-bar-row">
          <div className="tree-search-box">
            <Search size={14} className="tree-search-icon" />
            <input
              type="text"
              className="tree-search-input"
              placeholder="Search keys, values, or paths..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveMatchIndex(0);
              }}
              data-testid="yaml-tree-search"
            />
            {searchQuery && (
              <button
                type="button"
                className="tree-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="tree-search-options">
            <button
              type="button"
              className={`btn-subtle-toggle ${isCaseSensitive ? 'active' : ''}`}
              onClick={() => setIsCaseSensitive(!isCaseSensitive)}
              title="Match Case"
            >
              Aa
            </button>
            <button
              type="button"
              className={`btn-subtle-toggle ${isExactMatch ? 'active' : ''}`}
              onClick={() => setIsExactMatch(!isExactMatch)}
              title="Exact Match"
            >
              [=]
            </button>
            <select
              className="select-control select-xs"
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value as any)}
              title="Search Scope"
            >
              <option value="all">All</option>
              <option value="keys">Keys Only</option>
              <option value="values">Values Only</option>
            </select>
          </div>

          {searchMatches.length > 0 && (
            <div className="tree-match-nav">
              <span className="tree-match-count">
                {activeMatchIndex + 1} of {searchMatches.length}
              </span>
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={goToPrevMatch}
                title="Previous match"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={goToNextMatch}
                title="Next match"
              >
                <ArrowDown size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="tree-toolbar-controls">
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={expandAll}
            title="Expand all nodes"
          >
            <Maximize2 size={13} />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={collapseAll}
            title="Collapse all nodes"
          >
            <Minimize2 size={13} />
            <span>Collapse</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={expandOneLevel}
            title="Expand top-level keys"
          >
            <FolderTree size={13} />
            <span>Top Level</span>
          </button>
        </div>
      </div>

      {/* Tree Content Body */}
      <div className="tree-content-scroll" style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>
        {nodes.length === 0 ? (
          <div className="p-6 text-center text-muted" style={{ padding: '2rem' }}>
            No YAML structure to display. Enter valid YAML in Code mode.
          </div>
        ) : (
          nodes.map((n) => renderTreeNode(n))
        )}
      </div>
    </div>
  );
}


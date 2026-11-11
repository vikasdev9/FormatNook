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
} from 'lucide-react';
import { JsonDataType } from '../types/json.types';
import { useClipboard } from '@/hooks/useClipboard';

interface JsonTreeViewProps {
  data: any;
  onSelectPath?: (path: string) => void;
}

export function JsonTreeView({ data, onSelectPath }: JsonTreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['$']));
  const [searchQuery, setSearchQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'keys' | 'values'>('all');
  const [activePath, setActivePath] = useState<string>('$');
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const { copy } = useClipboard();

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const paths = new Set<string>();
    let count = 0;
    const MAX_NODES = 2500;

    function traverse(node: any, path: string) {
      if (count >= MAX_NODES) return;
      if (typeof node === 'object' && node !== null) {
        paths.add(path);
        count++;
        if (Array.isArray(node)) {
          for (let i = 0; i < node.length; i++) {
            traverse(node[i], `${path}[${i}]`);
          }
        } else {
          for (const k of Object.keys(node)) {
            traverse(node[k], `${path}.${k}`);
          }
        }
      }
    }

    traverse(data, '$');
    setExpandedPaths(paths);
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(['$']));
  }, []);

  const expandOneLevel = useCallback(() => {
    const paths = new Set(expandedPaths);
    paths.add('$');
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          if (typeof data[i] === 'object' && data[i] !== null) {
            paths.add(`$[${i}]`);
          }
        }
      } else {
        for (const k of Object.keys(data)) {
          if (typeof data[k] === 'object' && data[k] !== null) {
            paths.add(`$.${k}`);
          }
        }
      }
    }
    setExpandedPaths(paths);
  }, [data, expandedPaths]);

  const expandToDepth = useCallback(
    (targetDepth: number) => {
      const paths = new Set<string>();
      function traverse(node: any, path: string, depth: number) {
        if (depth > targetDepth) return;
        if (typeof node === 'object' && node !== null) {
          paths.add(path);
          if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
              traverse(node[i], `${path}[${i}]`, depth + 1);
            }
          } else {
            for (const k of Object.keys(node)) {
              traverse(node[k], `${path}.${k}`, depth + 1);
            }
          }
        }
      }
      traverse(data, '$', 1);
      setExpandedPaths(paths);
    },
    [data]
  );

  // Collect all matching node paths for search navigation
  const matchedPaths: string[] = useMemo(() => {
    if (!searchQuery.trim() || data === null || data === undefined) return [];
    const query = isCaseSensitive ? searchQuery.trim() : searchQuery.toLowerCase().trim();
    const matches: string[] = [];

    function checkMatch(text: string): boolean {
      const target = isCaseSensitive ? text : text.toLowerCase();
      return isExactMatch ? target === query : target.includes(query);
    }

    function search(node: any, path: string, keyName: string) {
      if (node === null || node === undefined) return;

      const isKeyMatch = searchScope !== 'values' && checkMatch(keyName);
      let isValueMatch = false;

      if (searchScope !== 'keys') {
        if (typeof node !== 'object') {
          isValueMatch = checkMatch(String(node));
        }
      }

      if (isKeyMatch || isValueMatch) {
        matches.push(path);
      }

      if (typeof node === 'object') {
        if (Array.isArray(node)) {
          for (let i = 0; i < node.length; i++) {
            search(node[i], `${path}[${i}]`, `[${i}]`);
          }
        } else {
          for (const [k, v] of Object.entries(node)) {
            search(v, `${path}.${k}`, k);
          }
        }
      }
    }

    search(data, '$', 'root');
    return matches;
  }, [data, searchQuery, isCaseSensitive, isExactMatch, searchScope]);

  // Navigate matches
  const handleNextMatch = () => {
    if (matchedPaths.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matchedPaths.length;
    setActiveMatchIndex(nextIdx);
    focusMatch(matchedPaths[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchedPaths.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + matchedPaths.length) % matchedPaths.length;
    setActiveMatchIndex(prevIdx);
    focusMatch(matchedPaths[prevIdx]);
  };

  const focusMatch = (path: string) => {
    setActivePath(path);
    onSelectPath?.(path);

    // Expand parent paths so the node is visible
    const parts = path.split(/[\.\[]/);
    const pathsToExpand = new Set(expandedPaths);
    let cur = '$';
    pathsToExpand.add('$');

    // Expand all prefixes
    let reconstructed = '';
    for (let i = 0; i < path.length; i++) {
      if (path[i] === '.' || path[i] === '[') {
        pathsToExpand.add(reconstructed || '$');
      }
      reconstructed += path[i];
    }
    setExpandedPaths(pathsToExpand);
  };

  const handleCopyValue = (value: any, path: string) => {
    copy(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
    setCopiedAction(`val-${path}`);
    setTimeout(() => setCopiedAction(null), 1500);
  };

  const handleCopyPath = (path: string) => {
    copy(path);
    setCopiedAction(`path-${path}`);
    setTimeout(() => setCopiedAction(null), 1500);
  };

  const handleCopySubtree = (value: any, path: string) => {
    copy(JSON.stringify(value, null, 2));
    setCopiedAction(`sub-${path}`);
    setTimeout(() => setCopiedAction(null), 1500);
  };

  const handleSelectNode = (path: string) => {
    setActivePath(path);
    onSelectPath?.(path);
  };

  const renderNode = (keyName: string, value: any, path: string, depth: number) => {
    const isObject = typeof value === 'object' && value !== null;
    const isArray = Array.isArray(value);
    const isExpanded = expandedPaths.has(path);
    const isMatched = matchedPaths.includes(path);
    const isCurrentMatch = matchedPaths[activeMatchIndex] === path;
    const isSelected = activePath === path;

    let type: JsonDataType = 'null';
    if (value === null) type = 'null';
    else if (isArray) type = 'array';
    else if (typeof value === 'object') type = 'object';
    else if (typeof value === 'string') type = 'string';
    else if (typeof value === 'number') type = 'number';
    else if (typeof value === 'boolean') type = 'boolean';

    const childCount = isArray ? value.length : isObject ? Object.keys(value).length : 0;

    return (
      <div key={path} className={`json-tree-node ${isSelected ? 'tree-selected' : ''}`}>
        <div
          className={`tree-node-row ${isMatched ? 'tree-search-match' : ''} ${isCurrentMatch ? 'tree-active' : ''}`}
          style={{ paddingLeft: `${depth * 18}px` }}
          onClick={() => handleSelectNode(path)}
          data-testid={`tree-node-${path}`}
        >
          {/* Expand/Collapse Toggle Button */}
          {isObject ? (
            <button
              type="button"
              className="tree-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(path);
              }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              data-testid={`btn-expand-${path}`}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="tree-leaf-spacer" />
          )}

          {/* Node Key */}
          {keyName && (
            <span className="tree-node-key" data-testid={`tree-key-${keyName}`}>
              {keyName}
              <span className="tree-colon">:</span>
            </span>
          )}

          {/* Node Value / Structure Metadata */}
          {isObject ? (
            <span className="tree-node-meta">
              {isArray ? `Array[${childCount}]` : `{${childCount} ${childCount === 1 ? 'prop' : 'props'}}`}
            </span>
          ) : (
            <span className={`tree-node-value tree-type-${type}`} data-testid={`tree-value-${path}`}>
              {type === 'string' ? `"${value}"` : String(value)}
            </span>
          )}

          {/* Type Badge */}
          <span className={`tree-type-pill tree-pill-${type}`}>{type}</span>

          {/* Contextual Node Actions */}
          <div className="tree-node-actions">
            {isObject && (
              <button
                type="button"
                className="tree-action-btn"
                title="Copy Subtree as JSON"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopySubtree(value, path);
                }}
                data-testid={`btn-copy-subtree-${path}`}
              >
                {copiedAction === `sub-${path}` ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                <span className="action-hover-hint">Subtree</span>
              </button>
            )}
            <button
              type="button"
              className="tree-action-btn"
              title="Copy JSONPath"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyPath(path);
              }}
              data-testid={`btn-copy-path-${path}`}
            >
              {copiedAction === `path-${path}` ? <Check size={11} className="text-success" /> : <FolderTree size={11} />}
              <span className="action-hover-hint">Path</span>
            </button>
            {!isObject && (
              <button
                type="button"
                className="tree-action-btn"
                title="Copy Value"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyValue(value, path);
                }}
              >
                {copiedAction === `val-${path}` ? <Check size={11} className="text-success" /> : <Copy size={11} />}
              </button>
            )}
          </div>
        </div>

        {/* Lazy Children Mounting */}
        {isObject && isExpanded && (
          <div className="tree-node-children">
            {isArray
              ? value.map((item: any, idx: number) =>
                  renderNode(`[${idx}]`, item, `${path}[${idx}]`, depth + 1)
                )
              : Object.keys(value).map((k) =>
                  renderNode(k, value[k], `${path}.${k}`, depth + 1)
                )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="json-tree-container" data-testid="json-tree-view">
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
              data-testid="tree-search-input"
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

          {/* Search Options & Match Navigation */}
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

            {matchedPaths.length > 0 && (
              <div className="tree-match-nav" data-testid="tree-matches-counter">
                <span className="match-counter-text">
                  {activeMatchIndex + 1} of {matchedPaths.length}
                </span>
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={handlePrevMatch}
                  title="Previous Match (Shift+F3)"
                  data-testid="btn-tree-prev-match"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={handleNextMatch}
                  title="Next Match (F3)"
                  data-testid="btn-tree-next-match"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tree Expansion Controls */}
        <div className="tree-toolbar-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={expandAll}
            title="Expand All Nodes"
            data-testid="btn-expand-all"
          >
            <Maximize2 size={13} />
            <span>Expand All</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={collapseAll}
            title="Collapse All Nodes"
            data-testid="btn-collapse-all"
          >
            <Minimize2 size={13} />
            <span>Collapse</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={expandOneLevel}
            title="Expand One Level"
            data-testid="btn-expand-one-level"
          >
            <Layers size={13} />
            <span>+1 Level</span>
          </button>

          <div className="tree-depth-select-group">
            <span className="tree-depth-label">Depth:</span>
            {[1, 2, 3, 4].map((d) => (
              <button
                key={d}
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => expandToDepth(d)}
                data-testid={`btn-depth-${d}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Path Breadcrumbs */}
      <div className="tree-breadcrumb-bar">
        <span className="breadcrumb-label">Active Path:</span>
        <code className="breadcrumb-path" data-testid="tree-active-path">
          {activePath}
        </code>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => handleCopyPath(activePath)}
          title="Copy Active JSONPath"
        >
          {copiedAction === `path-${activePath}` ? 'Copied!' : 'Copy Path'}
        </button>
      </div>

      {/* Hierarchical Body */}
      <div className="json-tree-body">
        {data === undefined || data === null ? (
          <div className="tree-empty-message">No JSON data loaded.</div>
        ) : (
          renderNode('root', data, '$', 0)
        )}
      </div>
    </div>
  );
}

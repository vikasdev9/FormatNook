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
  Tag,
  Code2,
} from 'lucide-react';
import { XmlTreeNode } from '../types/xml.types';
import { useClipboard } from '@/hooks/useClipboard';

interface XmlTreeViewProps {
  rootNode: XmlTreeNode | null;
  onSelectXPath?: (xpath: string) => void;
}

export function XmlTreeView({ rootNode, onSelectXPath }: XmlTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (rootNode) {
      initial.add(rootNode.id);
      if (rootNode.children) {
        rootNode.children.forEach((c) => initial.add(c.id));
      }
    }
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string>('');
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const { copy } = useClipboard();

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes((prev) => {
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
    if (!rootNode) return;
    const ids = new Set<string>();
    function traverse(node: XmlTreeNode) {
      ids.add(node.id);
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
    traverse(rootNode);
    setExpandedNodes(ids);
  }, [rootNode]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const expandOneLevel = useCallback(() => {
    if (!rootNode) return;
    const ids = new Set<string>([rootNode.id]);
    if (rootNode.children) {
      rootNode.children.forEach((c) => ids.add(c.id));
    }
    setExpandedNodes(ids);
  }, [rootNode]);

  // Flatten searchable nodes
  const searchMatches = useMemo(() => {
    if (!rootNode || !searchQuery.trim()) return [];

    const query = isCaseSensitive ? searchQuery : searchQuery.toLowerCase();
    const matches: { id: string; xpath: string }[] = [];

    function searchInNode(node: XmlTreeNode) {
      let isMatch = false;
      const nameStr = isCaseSensitive ? node.name : node.name.toLowerCase();
      const valStr = node.value ? (isCaseSensitive ? node.value : node.value.toLowerCase()) : '';
      const xpathStr = isCaseSensitive ? node.xpath : node.xpath.toLowerCase();

      const matchText = (target: string) =>
        isExactMatch ? target === query : target.includes(query);

      if (matchText(nameStr) || matchText(valStr) || matchText(xpathStr)) {
        isMatch = true;
      }

      if (!isMatch && node.attributes) {
        for (const [k, v] of Object.entries(node.attributes)) {
          if (
            matchText(isCaseSensitive ? k : k.toLowerCase()) ||
            matchText(isCaseSensitive ? v : v.toLowerCase())
          ) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch) {
        matches.push({ id: node.id, xpath: node.xpath });
      }

      if (node.children) {
        node.children.forEach(searchInNode);
      }
    }

    searchInNode(rootNode);
    return matches;
  }, [rootNode, searchQuery, isCaseSensitive, isExactMatch]);

  const goToNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % searchMatches.length;
    setActiveMatchIndex(nextIdx);
    const target = searchMatches[nextIdx];
    setActiveNodeId(target.id);

    // Auto expand ancestors
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      function expandAncestors(curNode: XmlTreeNode, targetId: string): boolean {
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
      if (rootNode) expandAncestors(rootNode, target.id);
      return next;
    });
  }, [searchMatches, activeMatchIndex, rootNode]);

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

  const renderNode = (node: XmlTreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isActive = activeNodeId === node.id;
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
            if (onSelectXPath) onSelectXPath(node.xpath);
          }}
        >
          {/* Expand/Collapse Chevron */}
          {hasChildren ? (
            <button
              type="button"
              className="tree-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="tree-leaf-spacer" />
          )}

          {/* Node Name */}
          <span className="tree-node-key" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            &lt;{node.name}
          </span>

          {/* Attributes List */}
          {node.attributes && (
            <div style={{ display: 'inline-flex', gap: '4px', margin: '0 4px', flexWrap: 'wrap' }}>
              {Object.entries(node.attributes).map(([attrK, attrV]) => (
                <span
                  key={attrK}
                  style={{
                    fontSize: '0.75rem',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                  title={`Attribute: ${attrK}="${attrV}"`}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{attrK}=</span>
                  <span style={{ color: 'var(--status-success)' }}>&quot;{attrV}&quot;</span>
                </span>
              ))}
            </div>
          )}

          <span className="tree-node-key" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            {hasChildren || node.value !== undefined ? '&gt;' : '/&gt;'}
          </span>

          {/* Text Value / CDATA */}
          {node.value !== undefined && (
            <span
              className={`tree-node-value ${node.type === 'cdata' ? 'tree-type-cdata' : 'tree-type-string'}`}
              style={{ marginLeft: '6px' }}
            >
              {node.type === 'cdata' ? `<![CDATA[${node.value}]]>` : node.value}
            </span>
          )}

          {/* Closing tag preview if leaf */}
          {node.value !== undefined && !hasChildren && (
            <span className="tree-node-key" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              &lt;/{node.name}&gt;
            </span>
          )}

          {/* Node Actions */}
          <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="tree-action-btn"
              title={`Copy XPath: ${node.xpath}`}
              onClick={() => handleCopy(node.xpath, `xpath-${node.id}`)}
            >
              {copiedAction === `xpath-${node.id}` ? (
                <Check size={11} className="text-success" />
              ) : (
                <span style={{ fontSize: '10px' }}>xpath</span>
              )}
            </button>

            {node.value && (
              <button
                type="button"
                className="tree-action-btn"
                title="Copy Value"
                onClick={() => handleCopy(node.value!, `val-${node.id}`)}
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

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="tree-node-children">
            {node.children!.map((child) => renderNode(child))}
            <div
              className="tree-node-row"
              style={{
                paddingLeft: `${node.depth * 18 + 24}px`,
                color: 'var(--accent-primary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              &lt;/{node.name}&gt;
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="json-tree-container" data-testid="xml-tree-view">
      {/* Top Search Toolbar */}
      <div className="json-tree-toolbar">
        <div className="tree-search-bar-row">
          <div className="tree-search-box">
            <Search size={14} className="tree-search-icon" />
            <input
              type="text"
              className="tree-search-input"
              placeholder="Search tags, attributes, values, or XPath..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveMatchIndex(0);
              }}
              data-testid="xml-tree-search"
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
            title="Expand all elements"
          >
            <Maximize2 size={13} />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={collapseAll}
            title="Collapse all"
          >
            <Minimize2 size={13} />
            <span>Collapse</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={expandOneLevel}
            title="Expand root children"
          >
            <FolderTree size={13} />
            <span>Top Level</span>
          </button>
        </div>
      </div>

      {/* Tree Body */}
      <div className="tree-content-scroll" style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>
        {!rootNode ? (
          <div className="p-6 text-center text-muted" style={{ padding: '2rem' }}>
            No XML document loaded or syntax is invalid.
          </div>
        ) : (
          renderNode(rootNode)
        )}
      </div>
    </div>
  );
}


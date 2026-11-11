'use client';

import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, FileCode, Tag } from 'lucide-react';
import { XmlTreeNode } from '../types/xml.types';
import { useClipboard } from '@/hooks/useClipboard';

interface XmlStructuredViewProps {
  rootNode: XmlTreeNode | null;
}

export function XmlStructuredView({ rootNode }: XmlStructuredViewProps) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { copy } = useClipboard();

  // Flatten nodes into list for structured tabular viewing
  const flatNodes = useMemo(() => {
    if (!rootNode) return [];
    const list: XmlTreeNode[] = [];
    function traverse(node: XmlTreeNode) {
      list.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
    traverse(rootNode);
    return list;
  }, [rootNode]);

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return flatNodes;
    const q = search.toLowerCase();
    return flatNodes.filter((node) => {
      const matchName = node.name.toLowerCase().includes(q);
      const matchVal = node.value?.toLowerCase().includes(q);
      const matchXPath = node.xpath.toLowerCase().includes(q);
      const matchAttr = node.attributes && Object.entries(node.attributes).some(([k, v]) =>
        k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
      );
      return matchName || matchVal || matchXPath || matchAttr;
    });
  }, [flatNodes, search]);

  const handleCopy = (text: string, id: string) => {
    copy(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="json-structured-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search Header */}
      <div className="json-tree-toolbar" style={{ padding: '0.5rem 1rem' }}>
        <div className="tree-search-bar-row" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div className="tree-search-box" style={{ width: '320px' }}>
            <Search size={14} className="tree-search-icon" />
            <input
              type="text"
              className="tree-search-input"
              placeholder="Filter by element, attribute, or value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="tree-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear filter"
              >
                &times;
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Tag size={14} />
            <span>{flatNodes.length} Elements &amp; Nodes</span>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {!rootNode ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No XML document loaded or syntax is invalid.
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: 'var(--bg-secondary)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 1rem', width: '220px', color: 'var(--text-muted)' }}>
                    Element Tag
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.5rem', width: '240px', color: 'var(--text-muted)' }}>
                    Attributes
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>
                    Text / Value
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 1rem', width: '200px', color: 'var(--text-muted)' }}>
                    XPath Location
                  </th>
                  <th style={{ textAlign: 'center', padding: '0.5rem', width: '80px', color: 'var(--text-muted)' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((node) => (
                  <tr
                    key={node.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {'  '.repeat(node.depth)}&lt;{node.name}&gt;
                    </td>
                    <td style={{ padding: '0.5rem 0.5rem' }}>
                      {node.attributes ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {Object.entries(node.attributes).map(([k, v]) => (
                            <span
                              key={k}
                              style={{
                                fontSize: '0.6875rem',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
                            >
                              <strong style={{ color: 'var(--text-secondary)' }}>{k}=</strong>
                              <span style={{ color: 'var(--status-success)' }}>&quot;{v}&quot;</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {node.value ? (
                        node.type === 'cdata' ? (
                          <span style={{ color: '#06b6d4' }}>&lt;![CDATA[{node.value}]]&gt;</span>
                        ) : (
                          node.value
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                      {node.xpath}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleCopy(node.xpath, `xpath-${node.id}`)}
                        title="Copy XPath"
                      >
                        {copiedId === `xpath-${node.id}` ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


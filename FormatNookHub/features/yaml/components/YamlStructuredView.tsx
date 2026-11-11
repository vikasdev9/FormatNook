'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Copy,
  Check,
  Download,
  FileText,
  ChevronDown,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { splitYamlDocuments } from '../services/yaml-service';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface YamlStructuredViewProps {
  yamlInput: string;
}

export function YamlStructuredView({ yamlInput }: YamlStructuredViewProps) {
  const [search, setSearch] = useState('');
  const [collapsedDocs, setCollapsedDocs] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { copy } = useClipboard();

  const docInfos = useMemo(() => {
    return splitYamlDocuments(yamlInput);
  }, [yamlInput]);

  const toggleDocCollapse = (idx: number) => {
    setCollapsedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    copy(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper to render value in table
  const renderValue = (val: any): React.ReactNode => {
    if (val === null || val === undefined) {
      return <span className="tree-type-null">null</span>;
    }
    if (typeof val === 'boolean') {
      return <span className="tree-type-boolean">{val ? 'true' : 'false'}</span>;
    }
    if (typeof val === 'number') {
      return <span className="tree-type-number">{val}</span>;
    }
    if (typeof val === 'string') {
      return <span className="tree-type-string">&quot;{val}&quot;</span>;
    }
    if (Array.isArray(val)) {
      return (
        <span className="tree-node-meta" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
          [{val.length} items] {JSON.stringify(val).slice(0, 80)}
          {JSON.stringify(val).length > 80 ? '...' : ''}
        </span>
      );
    }
    if (typeof val === 'object') {
      return (
        <span className="tree-node-meta" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
          {`{${Object.keys(val).length} keys}`} {JSON.stringify(val).slice(0, 80)}
          {JSON.stringify(val).length > 80 ? '...' : ''}
        </span>
      );
    }
    return String(val);
  };

  return (
    <div className="json-structured-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search Bar */}
      <div className="json-tree-toolbar" style={{ padding: '0.5rem 1rem' }}>
        <div className="tree-search-bar-row" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div className="tree-search-box" style={{ width: '320px' }}>
            <Search size={14} className="tree-search-icon" />
            <input
              type="text"
              className="tree-search-input"
              placeholder="Filter keys or values across documents..."
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
            <Layers size={14} />
            <span>{docInfos.length} {docInfos.length === 1 ? 'Document' : 'Documents in Stream'}</span>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {docInfos.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No YAML document loaded.
          </div>
        ) : (
          docInfos.map((doc, idx) => {
            const isCollapsed = collapsedDocs.has(idx);
            const docTitle =
              doc.data && typeof doc.data === 'object' && doc.data.kind
                ? `${doc.data.kind}: ${doc.data.metadata?.name || 'Unnamed'}`
                : doc.data && typeof doc.data === 'object' && doc.data.version
                ? `Compose Config (v${doc.data.version})`
                : `Document #${idx + 1}`;

            // Flatten properties for structured table
            let entries: [string, any][] = [];
            if (doc.data && typeof doc.data === 'object' && !Array.isArray(doc.data)) {
              entries = Object.entries(doc.data);
            } else if (Array.isArray(doc.data)) {
              entries = doc.data.map((item, i) => [`[${i}]`, item]);
            } else if (doc.data !== null && doc.data !== undefined) {
              entries = [['value', doc.data]];
            }

            // Filter entries by search
            const filteredEntries = search.trim()
              ? entries.filter(([k, v]) => {
                  const q = search.toLowerCase();
                  return (
                    k.toLowerCase().includes(q) ||
                    String(v).toLowerCase().includes(q) ||
                    JSON.stringify(v).toLowerCase().includes(q)
                  );
                })
              : entries;

            return (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-secondary)',
                  overflow: 'hidden',
                }}
              >
                {/* Document Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 1rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleDocCollapse(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    <FileText size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {docTitle}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Lines {doc.startLine}–{doc.endLine}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleCopy(doc.raw, `doc-raw-${idx}`)}
                      title="Copy raw YAML for this document"
                    >
                      {copiedId === `doc-raw-${idx}` ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => downloadFile(doc.raw, `document-${idx + 1}.yaml`, 'text/yaml')}
                      title="Download this document"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                </div>

                {/* Document Table Body */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    {filteredEntries.length === 0 ? (
                      <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {search ? 'No matching properties found in this document.' : 'Empty document.'}
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem 1rem', width: '220px', color: 'var(--text-muted)' }}>
                              Property Key
                            </th>
                            <th style={{ textAlign: 'left', padding: '0.5rem 0.5rem', width: '100px', color: 'var(--text-muted)' }}>
                              Data Type
                            </th>
                            <th style={{ textAlign: 'left', padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>
                              Value Preview
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEntries.map(([key, val], eIdx) => {
                            const valType = Array.isArray(val)
                              ? 'array'
                              : val === null
                              ? 'null'
                              : typeof val;

                            return (
                              <tr
                                key={eIdx}
                                style={{
                                  borderBottom: '1px solid var(--border-subtle)',
                                  backgroundColor: eIdx % 2 === 0 ? 'var(--bg-card)' : 'transparent',
                                }}
                              >
                                <td style={{ padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)' }}>
                                  {key}
                                </td>
                                <td style={{ padding: '0.5rem 0.5rem' }}>
                                  <span className={`tree-type-pill tree-pill-${valType}`}>
                                    {valType}
                                  </span>
                                </td>
                                <td style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
                                  {renderValue(val)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


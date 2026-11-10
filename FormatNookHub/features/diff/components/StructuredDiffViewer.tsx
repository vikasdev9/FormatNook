'use client';

import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  FileCode,
  Table,
  CheckCircle,
} from 'lucide-react';
import { DiffFormat } from '../types/diff.types';

interface StructuredDiffViewerProps {
  structuredData?: {
    type: DiffFormat;
    summary?: string;
    details?: any;
  };
  format: DiffFormat;
}

export function StructuredDiffViewer({ structuredData, format }: StructuredDiffViewerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!structuredData || !structuredData.details) {
    return null;
  }

  const { type, summary, details } = structuredData;

  const renderBadge = (kind: string) => {
    switch (kind) {
      case 'added':
      case 'element_added':
      case 'attribute_added':
        return <span className="structured-badge structured-badge-added">+ Added</span>;
      case 'removed':
      case 'element_removed':
      case 'attribute_removed':
        return <span className="structured-badge structured-badge-removed">- Removed</span>;
      case 'modified':
      case 'attribute_changed':
      case 'text_changed':
        return <span className="structured-badge structured-badge-modified">~ Modified</span>;
      case 'type_changed':
        return <span className="structured-badge structured-badge-type">Type Changed</span>;
      default:
        return <span className="structured-badge">{kind}</span>;
    }
  };

  const renderDetails = () => {
    // 1. JSON & YAML (array of path diffs)
    if (type === 'json' || type === 'yaml') {
      const items: any[] = Array.isArray(details) ? details : [];
      if (items.length === 0) {
        return <div className="structured-empty-msg">No structural key or value differences.</div>;
      }
      return (
        <div className="structured-items-list" data-testid="structured-diff-list">
          {items.slice(0, 50).map((item, idx) => (
            <div key={idx} className="structured-diff-item">
              <div className="structured-item-header">
                {renderBadge(item.kind)}
                <code className="structured-path">{item.path}</code>
              </div>
              <div className="structured-item-values">
                {item.oldValue !== undefined && (
                  <span className="diff-val-old">
                    Old: <code>{JSON.stringify(item.oldValue)}</code>
                  </span>
                )}
                {item.newValue !== undefined && (
                  <span className="diff-val-new">
                    New: <code>{JSON.stringify(item.newValue)}</code>
                  </span>
                )}
                {item.oldType && item.newType && (
                  <span className="diff-val-type">
                    ({item.oldType} &rarr; {item.newType})
                  </span>
                )}
              </div>
            </div>
          ))}
          {items.length > 50 && (
            <div className="structured-more-hint">...and {items.length - 50} more structural changes.</div>
          )}
        </div>
      );
    }

    // 2. CSV
    if (type === 'csv') {
      const { headers, rowStats, cellChanges } = details;
      return (
        <div className="structured-csv-details" data-testid="structured-csv-details">
          <div className="structured-stats-row">
            {rowStats && (
              <>
                <span className="pill-stat">Added Rows: <strong>{rowStats.addedRows}</strong></span>
                <span className="pill-stat">Removed Rows: <strong>{rowStats.removedRows}</strong></span>
                <span className="pill-stat">Modified Rows: <strong>{rowStats.modifiedRows}</strong></span>
                <span className="pill-stat">Unchanged Rows: <strong>{rowStats.unchangedRows}</strong></span>
              </>
            )}
          </div>

          {headers && (headers.added?.length > 0 || headers.removed?.length > 0) && (
            <div className="structured-header-changes">
              {headers.added?.length > 0 && (
                <div className="header-diff-tag text-success">
                  + Added Columns: <strong>{headers.added.join(', ')}</strong>
                </div>
              )}
              {headers.removed?.length > 0 && (
                <div className="header-diff-tag text-error">
                  - Removed Columns: <strong>{headers.removed.join(', ')}</strong>
                </div>
              )}
            </div>
          )}

          {cellChanges && cellChanges.length > 0 && (
            <div className="structured-table-wrapper">
              <table className="structured-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Column</th>
                    <th>Original Value</th>
                    <th>Modified Value</th>
                  </tr>
                </thead>
                <tbody>
                  {cellChanges.slice(0, 30).map((c: any, i: number) => (
                    <tr key={i}>
                      <td>#{c.rowIndex}</td>
                      <td><strong>{c.column}</strong></td>
                      <td className="text-error">{c.oldValue || '—'}</td>
                      <td className="text-success">{c.newValue || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // 3. SQL
    if (type === 'sql') {
      const clauseChanges: any[] = details.clauseChanges || [];
      return (
        <div className="structured-items-list" data-testid="structured-sql-details">
          {clauseChanges.map((c, i) => (
            <div key={i} className="structured-diff-item">
              <div className="structured-item-header">
                {renderBadge(c.kind)}
                <span className="sql-clause-badge">Stmt #{c.statementIndex}: {c.clause}</span>
              </div>
              <div className="structured-item-values">
                {c.oldValue && <span className="diff-val-old">Old: <code>{c.oldValue}</code></span>}
                {c.newValue && <span className="diff-val-new">New: <code>{c.newValue}</code></span>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 4. CSS
    if (type === 'css') {
      const ruleDiffs: any[] = details.ruleDiffs || [];
      return (
        <div className="structured-items-list" data-testid="structured-css-details">
          {ruleDiffs.map((r, i) => (
            <div key={i} className="structured-diff-item">
              <div className="structured-item-header">
                {renderBadge(r.kind)}
                <code className="structured-path">{r.selector}</code>
              </div>
              {r.propertyDiffs && r.propertyDiffs.length > 0 && (
                <div className="structured-item-sublist">
                  {r.propertyDiffs.map((p: any, j: number) => (
                    <div key={j} className="structured-sub-item">
                      {renderBadge(p.kind)}
                      <span className="prop-name"><code>{p.property}</code>:</span>
                      {p.oldValue && <span className="diff-val-old">{p.oldValue}</span>}
                      {p.oldValue && p.newValue && <span>&rarr;</span>}
                      {p.newValue && <span className="diff-val-new">{p.newValue}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // 5. XML & HTML
    if (type === 'xml' || type === 'html') {
      const items: any[] = Array.isArray(details) ? details : [];
      return (
        <div className="structured-items-list" data-testid="structured-markup-details">
          {items.slice(0, 40).map((item, i) => (
            <div key={i} className="structured-diff-item">
              <div className="structured-item-header">
                {renderBadge(item.kind)}
                <code className="structured-path">{item.path || item.tag}</code>
              </div>
              <div className="structured-item-values">
                {item.oldValue && <span className="diff-val-old">Old: <code>{item.oldValue}</code></span>}
                {item.newValue && <span className="diff-val-new">New: <code>{item.newValue}</code></span>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 6. JavaScript & Generic Code
    if (type === 'javascript' || type === 'code') {
      if (details.symbolChanges) {
        return (
          <div className="structured-items-list" data-testid="structured-js-details">
            {details.symbolChanges.map((s: any, i: number) => (
              <div key={i} className="structured-diff-item">
                <div className="structured-item-header">
                  {renderBadge(s.action)}
                  <span className="js-symbol-kind">[{s.kind}]</span>
                  <code className="structured-path">{s.name}</code>
                </div>
              </div>
            ))}
          </div>
        );
      }
      if (details.codeLinesChanged !== undefined) {
        return (
          <div className="structured-stats-row" data-testid="structured-code-stats">
            <span className="pill-stat">Code Lines Changed: <strong>{details.codeLinesChanged}</strong></span>
            <span className="pill-stat">Comment Lines Changed: <strong>{details.commentLinesChanged}</strong></span>
            <span className="pill-stat">Blank Lines Changed: <strong>{details.blankLinesChanged}</strong></span>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="structured-diff-card" data-testid="structured-diff-viewer">
      <button
        type="button"
        className="structured-card-header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="structured-header-title">
          <Layers size={16} className="text-accent" />
          <span>Structural Analysis ({type.toUpperCase()})</span>
          {summary && <span className="structured-summary-pill">{summary}</span>}
        </div>
        <div className="structured-header-action">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && <div className="structured-card-body">{renderDetails()}</div>}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, Copy, Check, Terminal, ExternalLink, Sparkles } from 'lucide-react';
import { evaluateJsonPath } from '../services/json-path-service';
import { JsonPathMatch } from '../types/json.types';
import { useClipboard } from '@/hooks/useClipboard';

interface JsonPathPanelProps {
  data: any;
  onExtractMatch?: (extractedJson: string) => void;
  onNavigateToPath?: (path: string) => void;
}

const JSONPATH_EXAMPLES = [
  { label: 'Root document ($)', expr: '$' },
  { label: 'All top-level keys ($.*)', expr: '$.*' },
  { label: 'Deep recursive search for "name" ($..name)', expr: '$..name' },
  { label: 'Deep search for "id" ($..id)', expr: '$..id' },
  { label: 'Array wildcard ($..skills[*])', expr: '$..skills[*]' },
];

export function JsonPathPanel({ data, onExtractMatch, onNavigateToPath }: JsonPathPanelProps) {
  const [expression, setExpression] = useState<string>('$.*');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const { copy } = useClipboard();

  const matches: JsonPathMatch[] = React.useMemo(() => {
    if (!expression.trim() || data === null || data === undefined) return [];
    try {
      return evaluateJsonPath(data, expression);
    } catch {
      return [];
    }
  }, [data, expression]);

  const handleCopyPath = (path: string) => {
    copy(path);
    setCopiedItem(`path-${path}`);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  const handleCopyValue = (val: any, id: string) => {
    copy(typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val));
    setCopiedItem(`val-${id}`);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  const handleExtractAll = () => {
    const extracted = matches.map((m) => m.value);
    onExtractMatch?.(JSON.stringify(extracted, null, 2));
  };

  return (
    <div className="json-path-panel" data-testid="json-path-panel">
      <div className="json-path-header">
        <div className="path-title">
          <Terminal size={15} className="text-accent" />
          <span>JSONPath Evaluator & Query Navigator</span>
        </div>
        <div className="path-examples">
          <label htmlFor="jsonpath-example-select" className="sr-only">Examples:</label>
          <select
            id="jsonpath-example-select"
            className="select-control select-sm"
            onChange={(e) => setExpression(e.target.value)}
            value=""
          >
            <option value="" disabled>Load JSONPath Example...</option>
            {JSONPATH_EXAMPLES.map((ex, i) => (
              <option key={i} value={ex.expr}>{ex.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="json-path-input-group">
        <span className="path-prefix">Expr:</span>
        <input
          type="text"
          className="json-path-input"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="e.g. $.store.book[*].author or $..id"
          data-testid="input-jsonpath-expression"
        />
        {matches.length > 0 && onExtractMatch && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExtractAll}
            title="Extract all matching values into editor"
            data-testid="btn-extract-jsonpath"
          >
            <Sparkles size={13} />
            <span>Extract Matches</span>
          </button>
        )}
      </div>

      <div className="json-path-results-info">
        <span>Found <strong>{matches.length}</strong> matching {matches.length === 1 ? 'node' : 'nodes'}</span>
      </div>

      <div className="json-path-results-list">
        {matches.length === 0 ? (
          <div className="path-empty-msg">No matches found for expression &quot;{expression}&quot;.</div>
        ) : (
          matches.slice(0, 100).map((m, idx) => (
            <div key={idx} className="json-path-result-item" data-testid="jsonpath-match-item">
              <div className="result-item-header">
                <code
                  className="result-path-tag"
                  onClick={() => onNavigateToPath?.(m.path)}
                  title="Click to view node"
                >
                  {m.path}
                </code>
                <div className="result-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleCopyPath(m.path)}
                    title="Copy Path"
                  >
                    {copiedItem === `path-${m.path}` ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span>Path</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleCopyValue(m.value, String(idx))}
                    title="Copy Value"
                  >
                    {copiedItem === `val-${idx}` ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span>Value</span>
                  </button>
                </div>
              </div>
              <div className="result-val-preview">
                <pre>{typeof m.value === 'object' ? JSON.stringify(m.value, null, 2) : String(m.value)}</pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

